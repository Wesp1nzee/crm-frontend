import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  LinearProgress,
  Checkbox,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  DeleteSweep,
  Restore,
  FolderOutlined,
  DescriptionOutlined,
  Person,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useTrashDocuments, useRestoreAssets, useDeleteTrashAssets } from "../../shared/hooks/useDocuments";
import type { FileSystemEntry } from "../../entities/document/types";
import { PaginationControls } from "../../shared/ui/PaginationControls";
import { notificationService } from "../../shared/services/notifications";

const fileIcons: Record<string, React.ReactNode> = {
  pdf: <DescriptionOutlined sx={{ color: "#D32F2F" }} />,
  doc: <DescriptionOutlined sx={{ color: "#2196F3" }} />,
  docx: <DescriptionOutlined sx={{ color: "#2196F3" }} />,
  xls: <DescriptionOutlined sx={{ color: "#4CAF50" }} />,
  xlsx: <DescriptionOutlined sx={{ color: "#4CAF50" }} />,
  jpg: <DescriptionOutlined sx={{ color: "#FF9800" }} />,
  jpeg: <DescriptionOutlined sx={{ color: "#FF9800" }} />,
  png: <DescriptionOutlined sx={{ color: "#FF9800" }} />,
  zip: <DescriptionOutlined sx={{ color: "#9C27B0" }} />,
  rar: <DescriptionOutlined sx={{ color: "#9C27B0" }} />,
};

const getFileIcon = (entry: FileSystemEntry) => {
  if (entry.type === "folder") {
    return <FolderOutlined color="primary" />;
  }
  const ext = entry.extension?.replace(".", "").toLowerCase() || "";
  return fileIcons[ext] || <DescriptionOutlined color="action" />;
};

const formatCreatorName = (entry: FileSystemEntry): string => {
  if (entry.created_by_name) {
    return entry.created_by_name;
  }
  if (entry.created_by?.full_name) {
    return entry.created_by.full_name;
  }
  if (entry.created_by?.email) {
    return entry.created_by.email;
  }
  if (entry.created_by_id) {
    return `ID: ${entry.created_by_id}`;
  }
  return "Неизвестно";
};

export function TrashPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  const {
    data: trashResponse,
    isLoading,
    error,
    refetch,
  } = useTrashDocuments({ page: page + 1, limit: rowsPerPage });

  const restoreAssets = useRestoreAssets();
  const deleteTrashAssets = useDeleteTrashAssets();

  const entries = trashResponse?.items ?? [];
  const paginationMeta = trashResponse?.meta;

  const selectedEntries = useMemo(
    () => entries.filter((entry) => selectedEntryIds.includes(entry.id)),
    [entries, selectedEntryIds],
  );

  const isAllSelected =
    entries.length > 0 && selectedEntryIds.length === entries.length;

  const toggleSelect = (entryId: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEntryIds([]);
      return;
    }
    setSelectedEntryIds(entries.map((entry) => entry.id));
  };

  const handleRestore = async () => {
    if (!selectedEntries.length) return;
    try {
      await restoreAssets.mutateAsync({
        folder_ids: selectedEntries
          .filter((entry) => entry.type === "folder")
          .map((entry) => entry.id),
        document_ids: selectedEntries
          .filter((entry) => entry.type === "file")
          .map((entry) => entry.id),
      });
      notificationService.success(
        `Восстановлено элементов: ${selectedEntries.length}`,
      );
      setSelectedEntryIds([]);
      refetch();
    } catch (err) {
      console.error("Ошибка восстановления из корзины:", err);
      notificationService.error("Не удалось восстановить выбранные элементы");
    }
  };

  const handleDeleteForever = async () => {
    if (!selectedEntries.length) return;
    try {
      await deleteTrashAssets.mutateAsync({
        folder_ids: selectedEntries
          .filter((entry) => entry.type === "folder")
          .map((entry) => entry.id),
        document_ids: selectedEntries
          .filter((entry) => entry.type === "file")
          .map((entry) => entry.id),
      });
      notificationService.success(
        `Удалено навсегда: ${selectedEntries.length}`,
      );
      setSelectedEntryIds([]);
      refetch();
    } catch (err) {
      console.error("Ошибка безвозвратного удаления из корзины:", err);
      notificationService.error("Не удалось удалить выбранные элементы из корзины");
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexDirection={{ xs: "column", md: "row" }}
        gap={2}
        mb={2}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: 32, md: 38 }, fontWeight: 800 }}>
          Корзина
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/crm/documents")}
          >
            Назад к документам
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Restore />}
            disabled={selectedEntries.length === 0 || restoreAssets.isPending}
            onClick={handleRestore}
          >
            Восстановить
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweep />}
            disabled={selectedEntries.length === 0 || deleteTrashAssets.isPending}
            onClick={handleDeleteForever}
          >
            Удалить навсегда
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки корзины. Попробуйте обновить страницу.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ width: 52, py: 1 }}>
                  <Checkbox
                    size="small"
                    checked={isAllSelected}
                    indeterminate={
                      selectedEntryIds.length > 0 && !isAllSelected
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ width: 84, py: 1 }}>Превью</TableCell>
                <TableCell>Имя</TableCell>
                <TableCell sx={{ width: 160 }}>Тип</TableCell>
                <TableCell sx={{ width: 160 }}>Дата</TableCell>
                <TableCell sx={{ width: 180 }}>Кто создал</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} hover selected={selectedEntryIds.includes(entry.id)}>
                  <TableCell>
                    <Checkbox
                      size="small"
                      checked={selectedEntryIds.includes(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                    />
                  </TableCell>
                  <TableCell>{getFileIcon(entry)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: entry.type === "folder" ? 600 : 500 }}>
                      {entry.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {entry.type === "folder" ? "Папка" : "Файл"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(entry.created_at).format("DD.MM.YYYY HH:mm")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Person sx={{ fontSize: 14, color: "text.primary" }} />
                      <Typography variant="body2" color="text.primary">
                        {formatCreatorName(entry)}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      Корзина пуста
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
          <PaginationControls
            currentPage={page + 1}
            totalPages={paginationMeta?.total_pages || 1}
            totalItems={paginationMeta?.total_items || 0}
            hasPrev={paginationMeta?.has_prev ?? page > 0}
            hasNext={paginationMeta?.has_next ?? false}
            limit={rowsPerPage}
            limitOptions={[10, 25, 50, 100]}
            onLimitChange={(value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            onPrev={() => setPage((prev) => Math.max(prev - 1, 0))}
            onNext={() => setPage((prev) => prev + 1)}
          />
        </Box>
      </Paper>
    </Box>
  );
}
