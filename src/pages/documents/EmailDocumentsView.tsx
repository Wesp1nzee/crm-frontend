import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  TableSortLabel,
  Tooltip,
  Skeleton,
  Chip,
  Menu,
  MenuItem,
  Stack,
  alpha,
} from "@mui/material";
import {
  DescriptionOutlined,
  Download,
  MoreVert,
  Mail,
  OpenInNew,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import type { MailAttachmentType, MailAttachmentsResponse } from "../../entities/mail/types";
import {
  formatMailAttachmentSize,
  getMailAttachmentFileIcon,
} from "../../shared/hooks/useMailAttachments";
import { useDownloadMailAttachment } from "../../shared/hooks/useMailAttachments";

interface EmailDocumentsViewProps {
  attachments: MailAttachmentType[];
  isLoading: boolean;
  paginationMeta: MailAttachmentsResponse["meta"] | undefined;
  page: number;
  rowsPerPage: number;
  sortField: "filename" | "created_at" | "file_size";
  sortOrder: "asc" | "desc";
  onSortChange: (field: "filename" | "created_at" | "file_size") => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  searchQuery: string;
  attachmentType: "all" | "incoming" | "outgoing";
  onAttachmentTypeChange: (type: "all" | "incoming" | "outgoing") => void;
  onOpenMessage?: (messageId: string) => void;
}

const getFileIcon = (attachment: MailAttachmentType) => {
  const iconLabel = getMailAttachmentFileIcon(
    attachment.content_type,
    attachment.filename,
  );
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontSize: "0.875rem",
      }}
    >
      <DescriptionOutlined sx={{ color: "text.secondary" }} />
      <span>{iconLabel.split(" ").slice(1).join(" ")}</span>
    </Box>
  );
};

export function EmailDocumentsView({
  attachments,
  isLoading,
  paginationMeta,
  page,
  rowsPerPage: _rowsPerPage,
  sortField,
  sortOrder,
  onSortChange,
  onPageChange,
  onRowsPerPageChange: _onRowsPerPageChange,
  searchQuery,
  attachmentType,
  onAttachmentTypeChange,
  onOpenMessage,
}: EmailDocumentsViewProps) {
  const downloadMailAttachment = useDownloadMailAttachment();
  const total = paginationMeta?.total_items ?? attachments.length;

  const handleDownload = (attachment: MailAttachmentType) => {
    downloadMailAttachment.mutate({
      messageId: attachment.thread_id,
      attachmentId: attachment.id,
    });
  };

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAttachment, setSelectedAttachment] =
    useState<MailAttachmentType | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    attachment: MailAttachmentType,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAttachment(attachment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAttachment(null);
  };

  if (isLoading) {
    return (
      <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Skeleton width={120} />
                </TableCell>
                <TableCell>
                  <Skeleton width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton width={150} />
                </TableCell>
                <TableCell>
                  <Skeleton width={120} />
                </TableCell>
                <TableCell>
                  <Skeleton width={80} />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton width={200} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={150} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={40} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (attachments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(79,144,255,0.15), rgba(227,138,181,0.15))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mail sx={{ fontSize: 40, color: "primary.main" }} />
          </Box>
          <Typography variant="h6" fontWeight={700} mb={1}>
            В почте пока нет документов
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={400} mx="auto">
            {searchQuery
              ? `По запросу "${searchQuery}" ничего не найдено`
              : attachmentType !== "all"
                ? `В папке "${attachmentType === "incoming" ? "Входящие" : "Отправленные"}" нет вложений`
                : "Вложения из писем появятся здесь"}
          </Typography>
        </Paper>
      </motion.div>
    );
  }

  return (
    <>
      <Paper sx={{ borderRadius: 4, overflow: "hidden", mb: 2 }}>
        {/* Filter tabs */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            background: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <Stack direction="row" spacing={1}>
            {(["all", "incoming", "outgoing"] as const).map((type) => (
              <Chip
                key={type}
                label={
                  type === "all"
                    ? "Все"
                    : type === "incoming"
                      ? "Входящие"
                      : "Отправленные"
                }
                onClick={() => onAttachmentTypeChange(type)}
                variant={attachmentType === type ? "filled" : "outlined"}
                sx={{
                  fontWeight: attachmentType === type ? 600 : 500,
                  transition: "all 200ms ease",
                }}
              />
            ))}
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: "30%" }}>
                  <TableSortLabel
                    active={sortField === "filename"}
                    direction={sortField === "filename" ? sortOrder : "asc"}
                    onClick={() => onSortChange("filename")}
                  >
                    Название файла
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "25%" }}>
                  Отправитель
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "20%" }}>
                  Тема письма
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "15%" }}>
                  <TableSortLabel
                    active={sortField === "created_at"}
                    direction={sortField === "created_at" ? sortOrder : "desc"}
                    onClick={() => onSortChange("created_at")}
                  >
                    Дата
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: "10%" }}>
                  <TableSortLabel
                    active={sortField === "file_size"}
                    direction={sortField === "file_size" ? sortOrder : "desc"}
                    onClick={() => onSortChange("file_size")}
                  >
                    Размер
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attachments.map((attachment) => (
                <TableRow
                  key={attachment.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: alpha("#4F90FF", 0.04),
                    },
                    transition: "background-color 150ms ease",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {getFileIcon(attachment)}
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={attachment.filename}
                      >
                        {attachment.filename}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={
                        attachment.message_sender_name ||
                        attachment.message_sender_email
                      }
                    >
                      {attachment.message_sender_name ||
                        attachment.message_sender_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 250,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={attachment.message_subject || "Без темы"}
                    >
                      {attachment.message_subject || "Без темы"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(attachment.created_at).format("DD.MM.YYYY")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatMailAttachmentSize(attachment.file_size)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      {onOpenMessage && (
                        <Tooltip title="Перейти к письму">
                          <IconButton
                            size="small"
                            onClick={() => onOpenMessage(attachment.thread_id)}
                            sx={{
                              "&:hover": {
                                backgroundColor: alpha("#4F90FF", 0.1),
                              },
                            }}
                          >
                            <OpenInNew
                              fontSize="small"
                              sx={{ transform: "rotate(-45deg)" }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Скачать">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(attachment)}
                          sx={{
                            "&:hover": {
                              backgroundColor: alpha("#4F90FF", 0.1),
                            },
                          }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, attachment)}
                        sx={{
                          "&:hover": {
                            backgroundColor: alpha("#4F90FF", 0.1),
                          },
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {paginationMeta && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Показано {attachments.length} из {total} вложений
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                disabled={!paginationMeta.has_prev}
                onClick={() => onPageChange(page - 1)}
              >
                <Typography variant="body2">←</Typography>
              </IconButton>
              <Typography variant="body2" sx={{ py: 1 }}>
                Стр. {paginationMeta.current_page}
              </Typography>
              <IconButton
                size="small"
                disabled={!paginationMeta.has_next}
                onClick={() => onPageChange(page + 1)}
              >
                <Typography variant="body2">→</Typography>
              </IconButton>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {selectedAttachment && (
          <MenuItem
            onClick={() => {
              handleDownload(selectedAttachment);
              handleMenuClose();
            }}
          >
            <Download sx={{ mr: 1 }} />
            Скачать
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
