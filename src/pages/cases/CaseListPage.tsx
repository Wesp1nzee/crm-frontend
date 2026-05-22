// src/pages/cases/CaseListPage.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Fade,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  useCases,
  useCreateCase,
  useDeleteCase,
} from "../../shared/hooks/useCases";
import type { CaseStatus, GetCasesQuery } from "../../entities/case/types";
import { casesApi } from "../../entities/case/api";
import { CreateCaseDialog } from "./CreateCaseDialog";
import { CaseFilters } from "./CaseFilters";
import { notificationService } from "../../shared/services/notifications";
import { PaginationControls } from "../../shared/ui/PaginationControls";
import { usePermissions } from "../../shared/hooks/usePermissions";

// ─── localStorage helpers ──────────────────────────────────────
const CASE_LIST_STORAGE_KEY = "crm:cases:list:filters:v1";

type PersistedFilters = Omit<GetCasesQuery, "page" | "limit"> & {
  page?: number;
  limit?: number;
};

function loadFiltersFromStorage(): Partial<PersistedFilters> | null {
  try {
    const raw = localStorage.getItem(CASE_LIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFilters;
    
    return {
      ...parsed,
      page: parsed.page ? Number(parsed.page) : undefined,
      limit: parsed.limit ? Number(parsed.limit) : undefined,
      min_cost: parsed.min_cost ? Number(parsed.min_cost) : undefined,
      max_cost: parsed.max_cost ? Number(parsed.max_cost) : undefined,
      min_remaining_debt: parsed.min_remaining_debt 
        ? Number(parsed.min_remaining_debt) : undefined,
      max_remaining_debt: parsed.max_remaining_debt 
        ? Number(parsed.max_remaining_debt) : undefined,
    };
  } catch (error) {
    console.warn("[CaseList] Failed to load filters:", error);
    return null;
  }
}

function saveFiltersToStorage(filters: GetCasesQuery): void {
  try {
    const toPersist: PersistedFilters = {
      sort_field: filters.sort_field,
      sort_order: filters.sort_order,
      status: filters.status,
      expert_id: filters.expert_id,
      client_id: filters.client_id,
      start_date: filters.start_date,
      end_date: filters.end_date,
      case_type: filters.case_type,
      object_type: filters.object_type,
      authority: filters.authority,
      object_address: filters.object_address,
      number: filters.number,
      case_number: filters.case_number,
      has_assigned_expert: filters.has_assigned_expert,
      min_cost: filters.min_cost,
      max_cost: filters.max_cost,
      min_remaining_debt: filters.min_remaining_debt,
      max_remaining_debt: filters.max_remaining_debt,
      completion_start_date: filters.completion_start_date,
      completion_end_date: filters.completion_end_date,
      deadline_start_date: filters.deadline_start_date,
      deadline_end_date: filters.deadline_end_date,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    };
    localStorage.setItem(CASE_LIST_STORAGE_KEY, JSON.stringify(toPersist));
  } catch (error) {
    console.warn("[CaseList] Failed to save filters:", error);
  }
}

function clearFiltersFromStorage(): void {
  try {
    localStorage.removeItem(CASE_LIST_STORAGE_KEY);
  } catch (error) {
    console.warn("[CaseList] Failed to clear filters:", error);
  }
}
// ──────────────────────────────────────────────────────────────

const STATUSES_WITHOUT_OVERDUE_WARNING: CaseStatus[] = [
  "debt",
  "executed",
  "fssp",
  "archive",
  "withdrawn",
];

const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  archive: "Архив",
  in_work: "В работе",
  debt: "Долг",
  executed: "Выполнено",
  withdrawn: "Отозвано",
  cancelled: "Отменено",
  fssp: "ФССП",
};

export function CaseListPage() {
  const navigate = useNavigate();
  const { isExpert } = usePermissions();
  const [searchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<GetCasesQuery>(() => {
    const defaults: GetCasesQuery = {
      page: 1,
      limit: 20,
      sort_field: "number",  // 👈 сортировка по № по умолчанию
      sort_order: "desc",    // 👈 убывание → стрелка ↓
    };

    const clientId = searchParams.get("client");
    if (clientId) {
      defaults.client_id = clientId;
    }

    const saved = loadFiltersFromStorage();
    if (saved) {
      return {
        ...defaults,
        ...saved,
        page: saved.page ?? defaults.page,
        limit: saved.limit ?? defaults.limit,
      };
    }

    return defaults;
  });

  // Автосохранение фильтров при изменении
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCaseId, setDeletingCaseId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: casesResponse, isLoading, error, refetch } = useCases(filters);

  const createCase = useCreateCase();
  const deleteCase = useDeleteCase();

  const cases = casesResponse?.items || [];
  const meta = casesResponse?.meta;
  const totalCases = meta?.total_items || 0;
  const currentPage = meta?.current_page || 1;
  const totalPages = meta?.total_pages || 1;
  const pageSize = meta?.per_page || filters.limit || 20;
  const hasPrev = meta?.has_prev ?? currentPage > 1;
  const hasNext = meta?.has_next ?? currentPage < totalPages;

  const handleCreateSubmit = async (
    formData: Parameters<typeof createCase.mutateAsync>[0],
  ) => {
    try {
      await createCase.mutateAsync(formData);
      notificationService.success(
        `Дело "${formData.case_number}" успешно создано`,
      );
      setCreateDialogOpen(false);
      refetch();
    } catch (err: any) {
      notificationService.error(
        err.response?.data?.detail || "Ошибка создания дела",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingCaseId) return;
    try {
      await deleteCase.mutateAsync(deletingCaseId);
      notificationService.success("Дело успешно удалено");
      setDeleteDialogOpen(false);
      setDeletingCaseId("");
      refetch();
    } catch (err: any) {
      notificationService.error(
        err.response?.data?.detail || "Ошибка удаления дела",
      );
    }
  };

  const handleOpenDetail = (caseId: string) => navigate(`/crm/cases/${caseId}`);

  const handleOpenDelete = (caseId: string) => {
    setDeletingCaseId(caseId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingCaseId("");
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const exportParams = { ...filters };
      delete exportParams.page;
      delete exportParams.limit;
      
      await casesApi.exportCasesToExcel(exportParams);
      notificationService.success("Файл Excel успешно загружен");
    } catch (err: any) {
      notificationService.error(
        err.response?.data?.detail || "Ошибка экспорта в Excel",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      page: Math.max((prev.page || 1) - 1, 1),
    }));
  };

  const handleNextPage = () => {
    setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
  };

  const handleChangeLimit = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSortClick = (field: string) => {
    setFilters((prev) => {
      const currentField = prev.sort_field || "number";
      const currentOrder = prev.sort_order || "desc";
      
      if (currentField === field) {
        return {
          ...prev,
          sort_order: currentOrder === "asc" ? "desc" : "asc",
        };
      }
      
      return {
        ...prev,
        sort_field: field,
        sort_order: "asc",
      };
    });
  };

  const handleClearFilters = () => {
    clearFiltersFromStorage();
    setFilters({
      page: 1,
      limit: 20,
      sort_field: "number",
      sort_order: "desc",
      client_id: searchParams.get("client") || undefined,
    });
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
        Ошибка загрузки списка дел: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Дела
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {totalCases} дел
          </Typography>
        </Box>
        {!isExpert && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={isExporting}
              size="large"
              sx={{ borderRadius: 1.5, px: 2.25 }}
            >
              {isExporting ? <CircularProgress size={20} /> : "Экспорт в Excel"}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
              sx={{ borderRadius: 1.5, px: 2.25 }}
            >
              Создать дело
            </Button>
          </Stack>
        )}
      </Box>

      {/* Filters */}
      <CaseFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <Card
        elevation={0}
        sx={{ border: 1, borderColor: "divider", borderRadius: 4 }}
      >
        <TableContainer>
          <Table
            sx={{
              "& th:first-of-type, & td:first-of-type": { pl: 4 },
              "& th:last-of-type, & td:last-of-type": { pr: 4 },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "background.paper" }}>
                <TableCell 
                  width="5%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("number")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    №
                    {filters.sort_field === "number" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  width="15%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("case_number")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Номер дела
                    {filters.sort_field === "case_number" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell width="15%">Суд / Орган</TableCell>
                <TableCell width="20%">Адрес объекта</TableCell>
                <TableCell 
                  width="10%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("status")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Статус
                    {filters.sort_field === "status" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  width="10%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("deadline")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Срок
                    {filters.sort_field === "deadline" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  width="10%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("cost")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Стоимость
                    {filters.sort_field === "cost" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  width="10%"
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortClick("execution_date")}
                >
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Дата выполнения
                    {filters.sort_field === "execution_date" && (
                      filters.sort_order === "asc" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell width="12%">Эксперт</TableCell>
                <TableCell width="13%" align="center">
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((case_, index) => {
                const showOverdueWarning =
                  dayjs(case_.deadline).isBefore(dayjs(), "day") &&
                  !STATUSES_WITHOUT_OVERDUE_WARNING.includes(case_.status);

                return (
                  <TableRow
                    key={case_.id}
                    hover
                    onClick={() => handleOpenDetail(case_.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                      transition: "background-color 0.15s ease",
                      backgroundColor:
                        index % 2 ? "rgba(0,0,0,0.02)" : "transparent",
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {case_.number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="column" spacing={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {case_.case_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {case_.case_type}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{case_.authority}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={case_.object_address}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {case_.object_address}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={CASE_STATUS_LABELS[case_.status]}
                        size="small"
                        variant="filled"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 24,
                          bgcolor:
                            case_.status === "executed"
                              ? "rgba(34,197,94,0.14)"
                              : case_.status === "debt"
                                ? "rgba(245,158,11,0.14)"
                                : case_.status === "cancelled"
                                  ? "rgba(239,68,68,0.14)"
                                  : case_.status === "in_work"
                                    ? "rgba(79,144,255,0.14)"
                                    : "rgba(120,120,120,0.12)",
                          color:
                            case_.status === "executed"
                              ? "success.dark"
                              : case_.status === "debt"
                                ? "warning.dark"
                                : case_.status === "cancelled"
                                  ? "error.dark"
                                  : case_.status === "in_work"
                                    ? "primary.dark"
                                    : "text.secondary",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: showOverdueWarning
                            ? "error.main"
                            : "text.primary",
                          fontWeight: showOverdueWarning ? "medium" : "regular",
                        }}
                      >
                        {dayjs(case_.deadline).format("DD.MM.YYYY")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {new Intl.NumberFormat("ru-RU").format(
                          Number(case_.cost),
                        )}{" "}
                        ₽
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {case_.execution_date
                          ? dayjs(case_.execution_date).format("DD.MM.YYYY")
                          : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(case_.experts ?? []).length > 0 ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {case_.experts[0]?.full_name?.charAt(0) ?? "?"}
                          </Avatar>
                          <Typography variant="body2" noWrap>
                            {(case_.experts ?? []).map((expert) => expert.full_name).join(", ")}
                          </Typography>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" color="disabled" />
                          <Typography variant="body2" color="text.secondary">
                            Не назначены
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="Просмотр" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(case_.id);
                            }}
                            sx={{
                              "&:hover": { backgroundColor: "action.hover" },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!isExpert && (
                          <Tooltip title="Удалить" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(case_.id);
                              }}
                              sx={{
                                color: "text.secondary",
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                  color: "text.primary",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {cases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Stack spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 88,
                          height: 88,
                          borderRadius: 6,
                          background:
                            "linear-gradient(160deg, rgba(79,144,255,0.3), rgba(255,255,255,0.75))",
                          border: "1px solid rgba(255,255,255,0.9)",
                          backdropFilter: "blur(10px)",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 14px 30px rgba(79,144,255,0.18)",
                        }}
                      >
                        <InfoIcon
                          sx={{ color: "primary.main", fontSize: 40 }}
                        />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        Нет данных
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Создайте первое дело для начала работы
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCases}
            hasPrev={hasPrev}
            hasNext={hasNext}
            limit={pageSize}
            onLimitChange={handleChangeLimit}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </Box>
      </Card>

      {/* ── Create dialog ── */}
      {!isExpert && (
        <CreateCaseDialog
          open={createDialogOpen}
          isPending={createCase.isPending}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {/* ── Delete confirmation dialog ── */}
      {!isExpert && (
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Fade}
          transitionDuration={200}
          PaperProps={{
            sx: {
              borderRadius: "16px",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "error.light",
              color: "error.contrastText",
            }}
          >
            <WarningIcon />
            Подтверждение удаления
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{
                  bgcolor: "warning.light",
                  color: "warning.contrastText",
                  border: "none",
                }}
              >
                Вы уверены, что хотите удалить это дело? Это действие нельзя
                отменить.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                После удаления все связанные данные будут безвозвратно потеряны.
                Убедитесь, что вы сохранили все необходимые документы.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{ p: 3, pt: 2, borderTop: 1, borderColor: "divider" }}
          >
            <Button
              onClick={handleCloseDeleteDialog}
              variant="outlined"
              size="large"
              disabled={deleteCase.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              size="large"
              startIcon={<DeleteIcon />}
              disabled={deleteCase.isPending}
            >
              {deleteCase.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}