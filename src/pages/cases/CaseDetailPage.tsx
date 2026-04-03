import {
  Box,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Button,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Alert,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Edit,
  Person,
  Business,
  Description,
  Download,
  Email,
  Phone,
  Visibility,
  Assignment,
  Save,
  Cancel,
  ArrowBack,
  FileDownload,
  PictureAsPdf,
  InsertDriveFile,
  Folder,
  CheckCircle,
  Warning,
  Upload,
  LinkOff,
  AttachFile,
  Star,
  LabelImportant,
  FiberManualRecord,
  ArrowForwardIos,
  AccessTime,
  AccountBalance,
  TrendingUp,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useCase, usePatchCase, useUpdateCaseExperts } from "../../shared/hooks/useCases";
import {
  useUploadDocument,
  useDownloadDocument,
  usePreviewDocument,
  useCreateFolder,
} from "../../shared/hooks/useDocuments";
import { useDownloadCaseDocuments } from "../../shared/hooks/useCases";
import { useUnlinkMailFromCase } from "../../shared/hooks/useMail";
import type { CaseStatus } from "../../entities/case/types";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { notificationService } from "../../shared/services/notifications";
import { usePermissions } from "../../shared/hooks/usePermissions";
import { useExpertsSuggest } from "../../shared/hooks/useExpertsSuggest";

// ─── design tokens (shared with ClientDetailPage) ─────────────────────────────

const ACCENT       = "#2563EB";
const ACCENT_SOFT  = "#EFF6FF";
const ACCENT_MID   = "#BFDBFE";
const SURFACE      = "#FFFFFF";
const SURFACE_2    = "#F8FAFC";
const BORDER       = "#E2E8F0";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#64748B";
const TEXT_MUTED     = "#94A3B8";

const SUCCESS      = "#16A34A";
const SUCCESS_SOFT = "#F0FDF4";
const SUCCESS_MID  = "#BBF7D0";
const WARNING      = "#D97706";
const WARNING_SOFT = "#FFFBEB";
const WARNING_MID  = "#FDE68A";
const DANGER       = "#DC2626";
const DANGER_SOFT  = "#FEF2F2";
const DANGER_MID   = "#FECACA";

const card = {
  borderRadius: "14px",
  border: `1px solid ${BORDER}`,
  background: SURFACE,
  boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  transition: "box-shadow 0.2s ease",
  "&:hover": { boxShadow: "0 4px 16px rgba(15,23,42,0.09)" },
};

// ─── label maps ───────────────────────────────────────────────────────────────

const statusLabels: Record<CaseStatus, string> = {
  archive:   "Архив",
  in_work:   "В работе",
  debt:      "Долг",
  executed:  "Выполнено",
  withdrawn: "Отозвано",
  cancelled: "Отменено",
  fssp:      "ФССП",
};

type StatusColor = { bg: string; border: string; text: string; dot: string };
const statusColors: Record<CaseStatus, StatusColor> = {
  in_work:   { bg: ACCENT_SOFT,  border: ACCENT_MID,   text: ACCENT,   dot: ACCENT   },
  executed:  { bg: SUCCESS_SOFT, border: SUCCESS_MID,  text: SUCCESS,  dot: SUCCESS  },
  debt:      { bg: WARNING_SOFT, border: WARNING_MID,  text: WARNING,  dot: WARNING  },
  cancelled: { bg: DANGER_SOFT,  border: DANGER_MID,   text: DANGER,   dot: DANGER   },
  archive:   { bg: SURFACE_2,    border: BORDER,       text: TEXT_SECONDARY, dot: TEXT_MUTED },
  withdrawn: { bg: SURFACE_2,    border: BORDER,       text: TEXT_SECONDARY, dot: TEXT_MUTED },
  fssp:      { bg: ACCENT_SOFT,  border: ACCENT_MID,   text: ACCENT,   dot: ACCENT   },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isSystemOrTempFile = (file: File) => {
  const relativePath = file.webkitRelativePath || file.name;
  const fileName = relativePath.split("/").pop() || file.name;
  const lowerName = fileName.toLowerCase();
  const pathParts = relativePath.split("/").map((p) => p.toLowerCase());
  return (
    fileName.startsWith("~$") || fileName.startsWith("._") || fileName.startsWith("~") ||
    lowerName === ".ds_store" || lowerName === "thumbs.db" || lowerName === "desktop.ini" ||
    pathParts.includes("__macosx")
  );
};

const walkDirectoryHandle = async (
  directoryHandle: FileSystemDirectoryHandle,
  parentPath = "",
): Promise<File[]> => {
  const basePath = parentPath ? `${parentPath}/${directoryHandle.name}` : directoryHandle.name;
  const files: File[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const entry of (directoryHandle as any).values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      Object.defineProperty(file, "webkitRelativePath", { value: `${basePath}/${file.name}`, writable: false });
      files.push(file);
    } else {
      files.push(...(await walkDirectoryHandle(entry, basePath)));
    }
  }
  return files;
};

function getFileExt(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function getFileIcon(filename: string) {
  const ext = getFileExt(filename);
  if (ext === "pdf") return <PictureAsPdf sx={{ fontSize: 18, color: DANGER }} />;
  if (["doc", "docx"].includes(ext)) return <Description sx={{ fontSize: 18, color: ACCENT }} />;
  if (["xls", "xlsx"].includes(ext)) return <Description sx={{ fontSize: 18, color: SUCCESS }} />;
  return <InsertDriveFile sx={{ fontSize: 18, color: TEXT_MUTED }} />;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── interfaces ───────────────────────────────────────────────────────────────

interface FileWithRelativePath extends File { webkitRelativePath: string; }
interface FileSystemEntryWebkit { isFile: boolean; isDirectory: boolean; fullPath: string; name: string; }
interface FileSystemFileEntryWebkit extends FileSystemEntryWebkit {
  file: (s: (f: File) => void, e?: (e: DOMException) => void) => void;
}
interface FileSystemDirectoryReaderWebkit {
  readEntries: (s: (e: FileSystemEntryWebkit[]) => void, e?: (e: DOMException) => void) => void;
}
interface FileSystemDirectoryEntryWebkit extends FileSystemEntryWebkit {
  createReader: () => FileSystemDirectoryReaderWebkit;
}
interface DataTransferItemWithEntry {
  webkitGetAsEntry: () => FileSystemEntryWebkit | null;
  getAsFile: () => File | null;
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, count, action, icon }: {
  title: string; count?: number; action?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        {icon && <Box sx={{ color: ACCENT, display: "flex" }}>{icon}</Box>}
        <Typography sx={{ fontSize: "15px", fontWeight: 700, color: TEXT_PRIMARY }}>{title}</Typography>
        {count !== undefined && (
          <Box sx={{
            minWidth: 20, height: 20, borderRadius: "6px",
            background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}`,
            display: "flex", alignItems: "center", justifyContent: "center", px: 0.75,
          }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: ACCENT }}>{count}</Typography>
          </Box>
        )}
      </Stack>
      {action}
    </Stack>
  );
}

// ─── InfoLabel ────────────────────────────────────────────────────────────────

function InfoLabel({ label }: { label: string }) {
  return (
    <Typography sx={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", color: TEXT_MUTED, mb: "4px" }}>
      {label}
    </Typography>
  );
}

// ─── EditableField ────────────────────────────────────────────────────────────

interface EditableFieldProps {
  field: string; value: string; displayValue?: string; label: string;
  editingField: string | null; editValues: Record<string, string>;
  onEdit: (f: string, v: string) => void; onSave: (f: string) => void; onCancel: () => void;
  multiline?: boolean; type?: string; required?: boolean; canEdit?: boolean;
}

function EditableField({
  field, value, displayValue, label, editingField, editValues,
  onEdit, onSave, onCancel, multiline, type = "text", required = false, canEdit = true,
}: EditableFieldProps) {
  const isEditing = canEdit && editingField === field;
  const currentValue = isEditing ? (editValues[field] ?? value) : value;
  const rendered = displayValue ?? value;

  return (
    <Box>
      <InfoLabel label={`${label}${required ? " *" : ""}`} />
      {isEditing ? (
        <Box sx={{
          display: "flex", alignItems: "flex-start", gap: 1,
          p: 1.5, borderRadius: "10px",
          background: ACCENT_SOFT, border: `1.5px solid ${ACCENT_MID}`,
        }}>
          <TextField
            size="small" value={currentValue} autoFocus fullWidth
            onChange={(e) => onEdit(field, e.target.value)}
            multiline={multiline} rows={multiline ? 3 : 1} type={type}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px", fontSize: "14px", background: SURFACE,
                "& fieldset": { borderColor: BORDER },
                "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" },
              },
            }}
          />
          <Tooltip title="Сохранить">
            <IconButton size="small" onClick={() => onSave(field)} sx={{
              width: 30, height: 30, borderRadius: "8px",
              background: SUCCESS_SOFT, border: `1px solid ${SUCCESS_MID}`,
              color: SUCCESS, mt: multiline ? 0.5 : 0,
              "&:hover": { background: SUCCESS_MID },
            }}>
              <Save sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Отменить">
            <IconButton size="small" onClick={onCancel} sx={{
              width: 30, height: 30, borderRadius: "8px",
              background: DANGER_SOFT, border: `1px solid ${DANGER_MID}`,
              color: DANGER, mt: multiline ? 0.5 : 0,
              "&:hover": { background: DANGER_MID },
            }}>
              <Cancel sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          onClick={canEdit ? () => onEdit(field, value) : undefined}
          sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 1.75, py: 1.25, borderRadius: "10px",
            background: SURFACE_2, border: `1px solid ${BORDER}`,
            minHeight: 44, cursor: canEdit ? "pointer" : "default",
            transition: "all 0.15s",
            ...(canEdit ? {
              "&:hover": {
                background: ACCENT_SOFT, borderColor: ACCENT_MID,
                boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.06)}`,
              },
            } : {}),
          }}
        >
          <Typography sx={{ flex: 1, fontSize: "14px", fontWeight: 500,
            color: rendered ? TEXT_PRIMARY : TEXT_MUTED }}>
            {rendered || "—"}
          </Typography>
          {canEdit && <Edit sx={{ fontSize: 13, color: TEXT_MUTED }} />}
        </Box>
      )}
    </Box>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, overdue }: { status: CaseStatus; overdue?: boolean }) {
  const colors = overdue
    ? { bg: DANGER_SOFT, border: DANGER_MID, text: DANGER, dot: DANGER }
    : statusColors[status];

  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.75,
      px: 1.5, py: 0.5, borderRadius: "8px",
      background: colors.bg, border: `1px solid ${colors.border}`,
    }}>
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot,
        boxShadow: `0 0 0 2px ${alpha(colors.dot, 0.2)}` }} />
      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: colors.text }}>
        {overdue ? "Просрочено" : statusLabels[status]}
      </Typography>
    </Box>
  );
}

// ─── AmountRow ────────────────────────────────────────────────────────────────

function AmountRow({ label, value, accent, onEdit, canEdit }: {
  label: string; value: string | number; accent?: string;
  onEdit?: () => void; canEdit?: boolean;
}) {
  return (
    <Box
      onClick={canEdit && onEdit ? onEdit : undefined}
      sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        px: 1.75, py: 1.25, borderRadius: "10px",
        background: SURFACE_2, border: `1px solid ${BORDER}`,
        cursor: canEdit && onEdit ? "pointer" : "default",
        transition: "all 0.15s",
        ...(canEdit && onEdit ? {
          "&:hover": {
            background: ACCENT_SOFT, borderColor: ACCENT_MID,
            boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.06)}`,
          },
        } : {}),
      }}
    >
      <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY, fontWeight: 500 }}>{label}</Typography>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: accent ?? TEXT_PRIMARY,
          fontFamily: '"JetBrains Mono", monospace' }}>
          {Number(value).toLocaleString("ru-RU")} ₽
        </Typography>
        {canEdit && onEdit && <Edit sx={{ fontSize: 13, color: TEXT_MUTED }} />}
      </Stack>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: caseData, isLoading, error, refetch } = useCase(id!);
  const patchCase = usePatchCase();
  const updateCaseExperts = useUpdateCaseExperts();
  const uploadDocument = useUploadDocument();
  const createFolder = useCreateFolder();
  const downloadDocument = useDownloadDocument();
  const previewDocument = usePreviewDocument();
  const downloadCaseDocuments = useDownloadCaseDocuments();
  const { isExpert, isAdmin, isCEO, isAccountant } = usePermissions();
  const canEditCase = !isExpert;
  const canManageExperts = isAdmin || isCEO || isAccountant;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<CaseStatus>();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [isFolderUploadInProgress, setIsFolderUploadInProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [selectedExperts, setSelectedExperts] = useState<Array<{ id: string; name: string }>>([]);
  const [isEditingExpert, setIsEditingExpert] = useState(false);
  const [draftExperts, setDraftExperts] = useState<Array<{ id: string; name: string }>>([]);
  const [draftExpertInput, setDraftExpertInput] = useState("");
  const { suggestions: expertSuggestions, isLoading: isExpertSuggestLoading,
    fetchSuggestions: fetchExpertSuggestions, clearSuggestions: clearExpertSuggestions } = useExpertsSuggest();

  useEffect(() => {
    if (!caseData) return;
    setStatus((prev) => prev !== caseData.case.status ? caseData.case.status : prev);
    const experts = (caseData.experts ?? []).map((e) => ({ id: e.id, name: e.full_name }));
    setSelectedExperts(experts);
    setDraftExperts(experts);
    setDraftExpertInput("");
  }, [caseData]);

  useEffect(() => { if (patchCase.isSuccess) notificationService.success("Изменения сохранены"); }, [patchCase.isSuccess]);
  useEffect(() => { if (patchCase.isError) notificationService.error("Ошибка при сохранении"); }, [patchCase.isError]);

  const case_ = caseData?.case;
  const client = caseData?.client;
  const assignedExperts = caseData?.experts ?? [];
  const documents = caseData?.documents ?? [];
  const folders = useMemo(() => caseData?.folders ?? [], [caseData?.folders]);
  const caseMessages = caseData?.messages ?? [];

  const buildFolderPathQuery = useCallback((targetFolderId: string) => {
    const folderById = new Map(folders.map((f) => [f.id, f]));
    const chain: Array<{ id: string; name: string }> = [];
    let currentId: string | undefined = targetFolderId;
    while (currentId) {
      const f = folderById.get(currentId);
      if (!f) break;
      chain.unshift({ id: f.id, name: f.name });
      currentId = f.parent_id;
    }
    return encodeURIComponent(JSON.stringify(chain));
  }, [folders]);

  const unlinkMail = useUnlinkMailFromCase();

  const handleUnlinkMail = async (messageId: string) => {
    try {
      await unlinkMail.mutateAsync(messageId);
      notificationService.success("Письмо отвязано от дела");
    } catch { notificationService.error("Не удалось отвязать письмо"); }
  };

  const handleOpenMessage = (message: typeof caseMessages[0]) => {
    const folder = message.folder || "inbox";
    const threadId = message.thread_id || message.id;
    if (threadId) navigate(`/crm/mail/${folder}/${threadId}`);
  };

  const costNum = Number(case_?.cost) || 0;
  const bankNum = Number(case_?.bank_transfer_amount) || 0;
  const cashNum = Number(case_?.cash_amount) || 0;
  const remainingDebtNum = Number(case_?.remaining_debt) || 0;
  const totalPaid = bankNum + cashNum;
  const progressPercent = costNum > 0 ? Math.min(100, (totalPaid / costNum) * 100) : 0;

  const uploadFilesAndFolders = useCallback(async (files: File[]) => {
    const validFiles = files.filter((f) => !isSystemOrTempFile(f));
    if (validFiles.length === 0) { notificationService.warning("Нет подходящих файлов"); return; }
    setIsFolderUploadInProgress(true);
    try {
      const folderPaths = new Set<string>();
      validFiles.forEach((file) => {
        const parts = (file.webkitRelativePath || file.name).split("/").slice(0, -1);
        for (let i = 1; i <= parts.length; i++) folderPaths.add(parts.slice(0, i).join("/"));
      });
      const sortedFolders = Array.from(folderPaths).sort((a, b) => a.split("/").length - b.split("/").length);
      const folderIdByPath = new Map<string, string>();
      for (const folderPath of sortedFolders) {
        const parts = folderPath.split("/");
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join("/");
        const parentId = parentPath ? (folderIdByPath.get(parentPath) ?? null) : null;
        const created = await createFolder.mutateAsync({ name, parent_id: parentId, case_id: parentId ? null : caseData?.case?.id });
        folderIdByPath.set(folderPath, created.id);
      }
      const totalFiles = validFiles.length;
      const maxConcurrency = Math.min(4, totalFiles);
      const progressByFile = new Map<number, number>();
      validFiles.forEach((_, i) => progressByFile.set(i, 0));
      const updateProgress = () => {
        const total = Array.from(progressByFile.values()).reduce((s, v) => s + v, 0);
        setUploadProgress(Math.round(total / totalFiles));
      };
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < totalFiles) {
          const idx = nextIndex++;
          const file = validFiles[idx];
          const relativePath = file.webkitRelativePath || file.name;
          const folderPath = relativePath.split("/").slice(0, -1).join("/");
          const folderId = folderPath ? (folderIdByPath.get(folderPath) ?? null) : null;
          setUploadingFileName(file.name);
          await uploadDocument.mutateAsync({
            file, folder_id: folderId, case_id: folderId ? null : caseData?.case?.id,
            title: uploadTitle || file.name,
            onUploadProgress: (p) => { progressByFile.set(idx, p); updateProgress(); },
          });
          progressByFile.set(idx, 100); updateProgress();
        }
      };
      await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));
      setUploadProgress(100); setSelectedFiles([]); setUploadTitle(""); setUploadDialogOpen(false);
      await refetch();
      notificationService.success(`Загружено: ${sortedFolders.length} папок, ${validFiles.length} файлов`);
    } catch { notificationService.error("Ошибка загрузки"); }
    finally { setIsFolderUploadInProgress(false); setUploadingFileName(""); setTimeout(() => setUploadProgress(0), 500); }
  }, [caseData?.case?.id, createFolder, refetch, uploadDocument, uploadTitle]);

  const extractDroppedFiles = useCallback(async (dataTransfer: DataTransfer): Promise<FileWithRelativePath[]> => {
    const items = Array.from(dataTransfer.items || []);
    if (items.length > 0) {
      const groups = await Promise.all(items.map(async (item) => {
        const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.();
        if (entry) return walkEntryRecursively(entry);
        const file = item.getAsFile();
        return file ? [file as FileWithRelativePath] : [];
      }));
      return groups.flat();
    }
    return Array.from(dataTransfer.files || []) as FileWithRelativePath[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault(); dragDepthRef.current++; setIsDragActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragActive(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault(); dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragActive(false);
    };
    const onDrop = async (e: DragEvent) => {
      if (!e.dataTransfer) return;
      e.preventDefault(); dragDepthRef.current = 0; setIsDragActive(false);
      const files = await extractDroppedFiles(e.dataTransfer);
      await uploadFilesAndFolders(files.filter((f) => !isSystemOrTempFile(f)));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [uploadFilesAndFolders, extractDroppedFiles]);

  // ─── early returns ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack alignItems="center" gap={1.5}>
          <CircularProgress size={32} sx={{ color: ACCENT }} />
          <Typography sx={{ fontSize: "13px", color: TEXT_MUTED }}>Загрузка дела...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !caseData || !case_ || !client) {
    return (
      <Alert severity="error" sx={{ borderRadius: "12px" }}
        action={<Button size="small" onClick={() => navigate("/crm/cases")}>К списку дел</Button>}>
        Дело не найдено
      </Alert>
    );
  }

  const isOverdue = dayjs(case_.deadline).isBefore(dayjs(), "day");
  const completedStatuses: CaseStatus[] = ["debt", "executed", "fssp", "archive", "withdrawn"];
  const isCompleted = completedStatuses.includes(case_.status);
  const hasOverdueWarning = isOverdue && !isCompleted;
  const hasCompletionDate = !!case_.completion_date;

  // ─── handlers ─────────────────────────────────────────────────────────────

  const handleStatusUpdate = () => {
    if (!canEditCase) return;
    if (status && status !== case_.status) patchCase.mutate({ id: case_.id, data: { status } });
  };

  const handleExpertEditStart = () => { if (!canManageExperts) return; setIsEditingExpert(true); setDraftExperts(selectedExperts); setDraftExpertInput(""); };
  const handleExpertEditCancel = () => { setIsEditingExpert(false); setDraftExperts(selectedExperts); setDraftExpertInput(""); clearExpertSuggestions(); };
  const handleExpertSave = () => {
    if (!canManageExperts) return;
    const curr = [...selectedExperts.map((e) => e.id)].sort();
    const next = [...draftExperts.map((e) => e.id)].sort();
    if (JSON.stringify(curr) === JSON.stringify(next)) { handleExpertEditCancel(); return; }
    updateCaseExperts.mutate({ id: case_.id, data: { expert_ids: draftExperts.map((e) => e.id) } }, {
      onSuccess: () => { setSelectedExperts(draftExperts); setIsEditingExpert(false); clearExpertSuggestions(); notificationService.success("Эксперты обновлены"); },
      onError: () => notificationService.error("Не удалось обновить экспертов"),
    });
  };

  const handleFieldEdit = (field: string, value: string) => { if (!canEditCase) return; setEditingField(field); setEditValues({ ...editValues, [field]: value }); };
  const handleFieldSave = (field: string) => {
    if (!canEditCase) return;
    const value = editValues[field];
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { [field]: value };
      if (["cost", "bank_transfer_amount", "cash_amount"].includes(field)) {
        const cost = field === "cost" ? Number(value) : costNum;
        const bank = field === "bank_transfer_amount" ? Number(value) : bankNum;
        const cash = field === "cash_amount" ? Number(value) : cashNum;
        updateData.remaining_debt = Math.max(0, cost - bank - cash).toString();
      }
      patchCase.mutate({ id: case_.id, data: updateData });
      setEditingField(null);
    }
  };
  const handleFieldCancel = () => { setEditingField(null); setEditValues({}); };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFiles((p) => [...p, ...Array.from(e.target.files!).filter((f) => !isSystemOrTempFile(f))]);
    }
    e.target.value = "";
  };
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFiles((p) => [...p, ...Array.from(e.target.files!).filter((f) => !isSystemOrTempFile(f))]);
    }
    e.target.value = "";
  };

  const handleSelectFolders = async () => {
    const w = window as Window & { showDirectoryPicker?: (o?: { mode?: string; multiple?: boolean }) => Promise<FileSystemDirectoryHandle | FileSystemDirectoryHandle[]> };
    if (!w.showDirectoryPicker) { folderInputRef.current?.click(); return; }
    try {
      const selected = await w.showDirectoryPicker({ mode: "read", multiple: true });
      const handles = Array.isArray(selected) ? selected : [selected];
      const files = (await Promise.all(handles.map((h) => walkDirectoryHandle(h)))).flat().filter((f) => !isSystemOrTempFile(f));
      if (files.length === 0) { notificationService.warning("Нет подходящих файлов"); return; }
      setSelectedFiles((p) => [...p, ...files]); setUploadDialogOpen(true);
    } catch (e) { if ((e as DOMException)?.name !== "AbortError") notificationService.error("Не удалось выбрать папки"); }
  };

  const readDirectoryEntries = (dir: FileSystemDirectoryEntryWebkit): Promise<FileSystemEntryWebkit[]> => {
    const reader = dir.createReader();
    return new Promise((resolve, reject) => {
      const entries: FileSystemEntryWebkit[] = [];
      const read = () => reader.readEntries((chunk) => { if (!chunk.length) { resolve(entries); return; } entries.push(...chunk); read(); }, reject);
      read();
    });
  };

  const walkEntryRecursively = async (entry: FileSystemEntryWebkit): Promise<FileWithRelativePath[]> => {
    if (entry.isFile) return new Promise((res, rej) => {
      (entry as FileSystemFileEntryWebkit).file((file) => {
        const path = entry.fullPath.startsWith("/") ? entry.fullPath.slice(1) : entry.fullPath;
        Object.defineProperty(file, "webkitRelativePath", { value: path, configurable: true });
        res([file as FileWithRelativePath]);
      }, rej);
    });
    if (entry.isDirectory) {
      const children = await readDirectoryEntries(entry as FileSystemDirectoryEntryWebkit);
      return (await Promise.all(children.map(walkEntryRecursively))).flat();
    }
    return [];
  };

  const handleDownload = (documentId: string) => {
    setDownloadLabel("Скачивание файла"); setDownloadProgress(0);
    downloadDocument.mutate({ documentId, onDownloadProgress: (p) => setDownloadProgress(p) },
      { onSettled: () => setTimeout(() => { setDownloadProgress(0); setDownloadLabel(""); }, 500) });
  };

  const handlePreview = (documentId: string) => previewDocument.mutate(documentId);

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 5 }}>

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <Box sx={{
        position: "relative", borderRadius: "16px", overflow: "hidden",
        mb: 3, border: `1px solid ${BORDER}`,
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 60%, #F8FAFC 100%)",
      }}>
        {/* blobs */}
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(ACCENT, 0.08)} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -30, left: "40%", width: 160, height: 160, borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(ACCENT, 0.05)} 0%, transparent 70%)`, pointerEvents: "none" }} />

        <Box sx={{ px: 3.5, py: 2.5, position: "relative" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>

            {/* Left: breadcrumb + title */}
            <Stack gap={0.75}>
              <Stack direction="row" alignItems="center" gap={1}>
                <IconButton size="small" onClick={() => navigate("/crm/cases")} sx={{
                  width: 28, height: 28, borderRadius: "8px",
                  border: `1px solid ${BORDER}`, color: TEXT_SECONDARY,
                  "&:hover": { background: SURFACE_2 },
                }}>
                  <ArrowBack sx={{ fontSize: 14 }} />
                </IconButton>
                <Typography sx={{ fontSize: "12px", color: TEXT_MUTED, fontWeight: 500 }}>Дела</Typography>
                <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>/</Typography>
                <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY, fontWeight: 600 }}>{case_.case_number}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
                {/* Avatar */}
                <Box sx={{
                  width: 48, height: 48, borderRadius: "13px",
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", flexShrink: 0,
                  boxShadow: `0 4px 14px ${alpha(ACCENT, 0.3)}`,
                }}>
                  <Assignment sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Typography sx={{ fontSize: "20px", fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: "-0.4px" }}>
                      {case_.case_number}
                    </Typography>
                    <StatusBadge status={case_.status} overdue={hasOverdueWarning} />
                    {case_.case_type && (
                      <Box sx={{ px: 1, py: 0.35, borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: TEXT_SECONDARY }}>{case_.case_type}</Typography>
                      </Box>
                    )}
                    {case_.object_type && (
                      <Box sx={{ px: 1, py: 0.35, borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, color: TEXT_SECONDARY }}>{case_.object_type}</Typography>
                      </Box>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: "13px", color: TEXT_SECONDARY, mt: 0.25 }}>
                    {hasOverdueWarning
                      ? `⚠️ Срок был ${dayjs(case_.deadline).format("DD.MM.YYYY")}`
                      : hasCompletionDate
                        ? `Завершено: ${dayjs(case_.completion_date).format("DD.MM.YYYY")}`
                        : `Срок: ${dayjs(case_.deadline).format("DD.MM.YYYY")}`}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {/* Right: quick stats */}
            <Stack direction="row" gap={1.5} flexShrink={0}>
              {costNum > 0 && (
                <Box sx={{ px: 2, py: 1.5, borderRadius: "10px", background: progressPercent >= 100 ? SUCCESS_SOFT : ACCENT_SOFT,
                  border: `1px solid ${progressPercent >= 100 ? SUCCESS_MID : ACCENT_MID}`, minWidth: 120 }}>
                  <Typography sx={{ fontSize: "11px", color: TEXT_MUTED, fontWeight: 600, letterSpacing: "0.04em", mb: 0.5 }}>
                    ОПЛАТА
                  </Typography>
                  <Typography sx={{ fontSize: "16px", fontWeight: 800,
                    color: progressPercent >= 100 ? SUCCESS : ACCENT,
                    fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.2 }}>
                    {Math.round(progressPercent)}%
                  </Typography>
                  {/* mini progress bar */}
                  <Box sx={{ mt: 0.75, height: 4, borderRadius: 4, background: alpha(progressPercent >= 100 ? SUCCESS : ACCENT, 0.15) }}>
                    <Box sx={{ height: "100%", borderRadius: 4, width: `${progressPercent}%`,
                      background: progressPercent >= 100 ? SUCCESS : ACCENT, transition: "width 0.4s ease" }} />
                  </Box>
                </Box>
              )}
              <Box sx={{ px: 2, py: 1.5, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: "11px", color: TEXT_MUTED, fontWeight: 600, letterSpacing: "0.04em" }}>ФАЙЛОВ</Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2 }}>
                  {folders.length + documents.length}
                </Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.5, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: "11px", color: TEXT_MUTED, fontWeight: 600, letterSpacing: "0.04em" }}>ПИСЕМ</Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2 }}>
                  {caseMessages.length}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: { xs: "wrap", lg: "nowrap" } }}>

        {/* ── Left column (main content) ─────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={2.5}>

            {/* Case Information Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Основная информация" icon={<Assignment sx={{ fontSize: 18 }} />} />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <EditableField canEdit={canEditCase} field="number" value={case_.number}
                    label="№ п/п" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  <EditableField canEdit={canEditCase} field="case_number" value={case_.case_number}
                    label="Номер дела" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  <EditableField canEdit={canEditCase} field="authority" value={case_.authority}
                    label="Суд / Орган" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  <EditableField canEdit={canEditCase} field="judge_name" value={case_.judge_name || ""}
                    label="ФИО судьи" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <EditableField canEdit={canEditCase} field="object_address" value={case_.object_address}
                      label="Адрес объекта" editingField={editingField} editValues={editValues}
                      onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  </Box>
                  {case_.plaintiff && (
                    <EditableField canEdit={canEditCase} field="plaintiff" value={case_.plaintiff}
                      label="Истец" editingField={editingField} editValues={editValues}
                      onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  )}
                  {case_.defendant && (
                    <EditableField canEdit={canEditCase} field="defendant" value={case_.defendant}
                      label="Ответчик" editingField={editingField} editValues={editValues}
                      onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} />
                  )}
                  {case_.remarks && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <EditableField canEdit={canEditCase} field="remarks" value={case_.remarks}
                        label="Примечания" editingField={editingField} editValues={editValues}
                        onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} multiline />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Клиент" icon={<Business sx={{ fontSize: 18 }} />} />

                {/* Client hero row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5,
                  p: 1.75, borderRadius: "12px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${alpha(ACCENT, 0.25)}` }}>
                    {client.type === "legal"
                      ? <Business sx={{ fontSize: 20, color: "#fff" }} />
                      : <Person sx={{ fontSize: 20, color: "#fff" }} />}
                  </Box>
                  <Box flex={1}>
                    <Typography sx={{ fontSize: "15px", fontWeight: 700, color: TEXT_PRIMARY }}>{client.name}</Typography>
                    {client.short_name && (
                      <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{client.short_name}</Typography>
                    )}
                  </Box>
                  <Box sx={{ px: 1, py: 0.35, borderRadius: "7px",
                    background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}` }}>
                    <Typography sx={{ fontSize: "11px", fontWeight: 700, color: ACCENT }}>
                      {client.type === "legal" ? "Юр. лицо" : client.type === "individual" ? "Физ. лицо" : "Суд"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: client.contacts?.length ? 2.5 : 0 }}>
                  {client.inn && (
                    <Box>
                      <InfoLabel label="ИНН" />
                      <Box sx={{ px: 1.75, py: 1.25, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: TEXT_PRIMARY }}>{client.inn}</Typography>
                      </Box>
                    </Box>
                  )}
                  {client.email && (
                    <Box>
                      <InfoLabel label="Email" />
                      <Box sx={{ px: 1.75, py: 1.25, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}`,
                        display: "flex", alignItems: "center", gap: 1 }}>
                        <Email sx={{ fontSize: 14, color: TEXT_MUTED }} />
                        <Typography component="a" href={`mailto:${client.email}`}
                          sx={{ fontSize: "14px", fontWeight: 500, color: ACCENT, textDecoration: "none",
                            "&:hover": { textDecoration: "underline" } }}>
                          {client.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {client.phone && (
                    <Box>
                      <InfoLabel label="Телефон" />
                      <Box sx={{ px: 1.75, py: 1.25, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}`,
                        display: "flex", alignItems: "center", gap: 1 }}>
                        <Phone sx={{ fontSize: 14, color: TEXT_MUTED }} />
                        <Typography component="a" href={`tel:${client.phone}`}
                          sx={{ fontSize: "14px", fontWeight: 500, color: ACCENT, textDecoration: "none",
                            "&:hover": { textDecoration: "underline" } }}>
                          {client.phone}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {client.legal_address && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <InfoLabel label="Юридический адрес" />
                      <Box sx={{ px: 1.75, py: 1.25, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                        <Typography sx={{ fontSize: "14px", fontWeight: 500, color: TEXT_PRIMARY }}>{client.legal_address}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Contacts */}
                {client.contacts?.length > 0 && (
                  <>
                    <Box sx={{ pt: 2, borderTop: `1px solid ${BORDER}`, mb: 1.5 }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: TEXT_PRIMARY }}>
                        Контактные лица
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      {client.contacts.map((contact: { id: string; name: string; position?: string; email?: string; phone?: string; is_main: boolean }) => (
                        <Box key={contact.id} sx={{
                          display: "flex", alignItems: "center", gap: 1.75,
                          px: 2, py: 1.5, borderRadius: "12px",
                          border: `1px solid ${contact.is_main ? ACCENT_MID : BORDER}`,
                          background: contact.is_main ? ACCENT_SOFT : SURFACE_2,
                        }}>
                          <Box sx={{ width: 34, height: 34, borderRadius: "9px", flexShrink: 0,
                            background: contact.is_main ? `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)` : "#E2E8F0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: contact.is_main ? "#fff" : TEXT_SECONDARY, fontSize: "12px", fontWeight: 700 }}>
                            {getInitials(contact.name)}
                          </Box>
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: TEXT_PRIMARY }}>{contact.name}</Typography>
                              {contact.is_main && (
                                <Box sx={{ px: 0.75, py: 0.2, borderRadius: "5px", background: ACCENT }}>
                                  <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#fff" }}>ОСНОВНОЙ</Typography>
                                </Box>
                              )}
                            </Stack>
                            <Stack direction="row" gap={1.5} flexWrap="wrap">
                              {contact.position && <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.position}</Typography>}
                              {contact.email && (
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                  <Email sx={{ fontSize: 11, color: TEXT_MUTED }} />
                                  <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.email}</Typography>
                                </Stack>
                              )}
                              {contact.phone && (
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                  <Phone sx={{ fontSize: 11, color: TEXT_MUTED }} />
                                  <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.phone}</Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  title="Файлы дела"
                  count={folders.length + documents.length}
                  icon={<Description sx={{ fontSize: 18 }} />}
                  action={
                    <Stack direction="row" gap={1}>
                      {canEditCase && (
                        <Button size="small" startIcon={<Upload sx={{ fontSize: 14 }} />}
                          onClick={() => setUploadDialogOpen(true)}
                          sx={{ borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "12px",
                            color: ACCENT, border: `1px solid ${ACCENT_MID}`, background: ACCENT_SOFT, px: 1.5,
                            "&:hover": { background: "#DBEAFE" } }}>
                          Загрузить
                        </Button>
                      )}
                      <Tooltip title="Скачать все (ZIP)">
                        <IconButton size="small" onClick={() => {
                          setDownloadLabel("Скачивание ZIP"); setDownloadProgress(0);
                          downloadCaseDocuments.mutate({ caseId: case_.id, onDownloadProgress: (p) => setDownloadProgress(p) },
                            { onSettled: () => setTimeout(() => { setDownloadProgress(0); setDownloadLabel(""); }, 500) });
                        }} sx={{ width: 30, height: 30, borderRadius: "8px", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
                          <FileDownload sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                />

                {/* Download progress */}
                {(downloadDocument.isPending || downloadCaseDocuments.isPending) && (
                  <Box sx={{ mb: 2, p: 1.5, borderRadius: "10px", background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}` }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{downloadLabel || "Скачивание"}</Typography>
                      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: ACCENT }}>{downloadProgress}%</Typography>
                    </Stack>
                    <Box sx={{ height: 4, borderRadius: 4, background: ACCENT_MID }}>
                      <Box sx={{ height: "100%", borderRadius: 4, width: `${downloadProgress}%`, background: ACCENT, transition: "width 0.2s" }} />
                    </Box>
                  </Box>
                )}

                {folders.length === 0 && documents.length === 0 ? (
                  <Box onClick={canEditCase ? () => setUploadDialogOpen(true) : undefined}
                    sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 4,
                      borderRadius: "10px", border: `1.5px dashed ${BORDER}`, cursor: canEditCase ? "pointer" : "default",
                      transition: "all 0.15s",
                      ...(canEditCase ? { "&:hover": { borderColor: ACCENT_MID, background: ACCENT_SOFT } } : {}) }}>
                    <Description sx={{ fontSize: 28, color: TEXT_MUTED }} />
                    <Typography sx={{ fontSize: "13px", color: TEXT_MUTED, fontWeight: 500 }}>
                      {canEditCase ? "Нет файлов. Нажмите для загрузки." : "Файлы отсутствуют"}
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={0.75}>
                    {folders.map((folder) => (
                      <Box key={`folder-${folder.id}`}
                        onClick={() => navigate(`/crm/documents?folderId=${folder.id}&folderName=${encodeURIComponent(folder.name)}&folderPath=${buildFolderPathQuery(folder.id)}`)}
                        sx={{ display: "flex", alignItems: "center", gap: 1.75, px: 2, py: 1.5,
                          borderRadius: "11px", border: `1px solid ${BORDER}`, background: SURFACE_2,
                          cursor: "pointer", transition: "all 0.15s",
                          "&:hover": { background: alpha("#D97706", 0.04), borderColor: "#FDE68A", boxShadow: `0 2px 8px ${alpha("#D97706", 0.08)}` } }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: "9px", flexShrink: 0,
                          background: alpha("#D97706", 0.1), border: `1px solid #FDE68A`,
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Folder sx={{ fontSize: 17, color: "#D97706" }} />
                        </Box>
                        <Box flex={1}>
                          <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: TEXT_PRIMARY }}>{folder.name}</Typography>
                          <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>Папка</Typography>
                        </Box>
                        <ArrowForwardIos sx={{ fontSize: 11, color: TEXT_MUTED }} />
                      </Box>
                    ))}
                    {documents.map((doc) => (
                      <Box key={doc.id}
                        sx={{ display: "flex", alignItems: "center", gap: 1.75, px: 2, py: 1.5,
                          borderRadius: "11px", border: `1px solid ${BORDER}`, background: SURFACE_2,
                          transition: "all 0.15s",
                          "&:hover": { background: ACCENT_SOFT, borderColor: ACCENT_MID, boxShadow: `0 2px 8px ${alpha(ACCENT, 0.08)}` } }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: "9px", flexShrink: 0,
                          background: SURFACE, border: `1px solid ${BORDER}`,
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {getFileIcon(doc.original_filename)}
                        </Box>
                        <Box flex={1} minWidth={0}>
                          <Typography sx={{ fontSize: "13.5px", fontWeight: 600, color: TEXT_PRIMARY,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</Typography>
                          <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>
                            {doc.original_filename} · {formatFileSize(doc.file_size)} · {dayjs(doc.created_at).format("DD.MM.YYYY")}
                          </Typography>
                        </Box>
                        <Stack direction="row" gap={0.5}>
                          <Tooltip title="Просмотр">
                            <IconButton size="small" onClick={() => handlePreview(doc.id)}
                              sx={{ width: 28, height: 28, borderRadius: "8px", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
                              <Visibility sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Скачать">
                            <IconButton size="small" onClick={() => handleDownload(doc.id)}
                              sx={{ width: 28, height: 28, borderRadius: "8px", border: `1px solid ${SUCCESS_MID}`,
                                color: SUCCESS, "&:hover": { background: SUCCESS_SOFT } }}>
                              <Download sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Mail Card */}
            {caseMessages.length > 0 && (
              <Card sx={card} elevation={0}>
                <CardContent sx={{ p: 2.5 }}>
                  <SectionHeader title="Почта" count={caseMessages.length} icon={<Email sx={{ fontSize: 18 }} />} />
                  <Stack spacing={1}>
                    {caseMessages.map((message) => (
                      <Box key={message.id}
                        onClick={() => handleOpenMessage(message)}
                        sx={{ display: "flex", alignItems: "center", gap: 1.75, px: 2, py: 1.5,
                          borderRadius: "12px",
                          border: `1px solid ${message.is_read ? BORDER : ACCENT_MID}`,
                          background: message.is_read ? SURFACE_2 : ACCENT_SOFT,
                          cursor: "pointer", transition: "all 0.15s",
                          "&:hover": { transform: "translateY(-1px)", boxShadow: `0 2px 10px ${alpha(ACCENT, 0.1)}` } }}>
                        <Avatar sx={{ width: 36, height: 36, borderRadius: "10px",
                          background: !message.is_read ? `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)` : "#E2E8F0",
                          color: !message.is_read ? "#fff" : TEXT_SECONDARY,
                          fontSize: "13px", fontWeight: 700 }}>
                          {(message.sender_name || message.sender_email).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            {!message.is_read && <FiberManualRecord sx={{ fontSize: 8, color: ACCENT }} />}
                            <Typography sx={{ fontSize: "13px", fontWeight: !message.is_read ? 700 : 500, color: TEXT_PRIMARY }}>
                              {message.sender_name || message.sender_email}
                            </Typography>
                            {message.is_starred && <Star sx={{ fontSize: 13, color: "#D97706" }} />}
                            {message.is_important && <LabelImportant sx={{ fontSize: 13, color: DANGER }} />}
                          </Stack>
                          <Typography sx={{ fontSize: "12.5px", fontWeight: !message.is_read ? 600 : 400,
                            color: TEXT_SECONDARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {message.subject || "(без темы)"}
                          </Typography>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>
                              {dayjs(message.sent_at).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                            <Box sx={{ px: 0.75, py: 0.2, borderRadius: "5px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                              <Typography sx={{ fontSize: "10px", fontWeight: 600, color: TEXT_SECONDARY }}>
                                {message.message_type === "incoming" ? "Вх." : "Исх."}
                              </Typography>
                            </Box>
                            {message.attachment_count > 0 && (
                              <Stack direction="row" alignItems="center" gap={0.5}>
                                <AttachFile sx={{ fontSize: 11, color: TEXT_MUTED }} />
                                <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>{message.attachment_count}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          {!message.is_read && (
                            <Box sx={{ px: 0.75, py: 0.2, borderRadius: "5px", background: ACCENT }}>
                              <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#fff" }}>НОВОЕ</Typography>
                            </Box>
                          )}
                          {canManageExperts && (
                            <Tooltip title="Отвязать от дела">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleUnlinkMail(message.id); }}
                                disabled={unlinkMail.isPending}
                                sx={{ width: 28, height: 28, borderRadius: "8px",
                                  border: `1px solid ${DANGER_MID}`, color: DANGER,
                                  "&:hover": { background: DANGER_SOFT } }}>
                                <LinkOff sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <ArrowForwardIos sx={{ fontSize: 11, color: TEXT_MUTED }} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>

        {/* ── Right sidebar ──────────────────────────────────────── */}
        <Box sx={{ width: { xs: "100%", lg: "340px" }, flexShrink: 0 }}>
          <Stack spacing={2.5}>

            {/* Status & Dates Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Состояние" />

                {/* Status select */}
                <Box sx={{ mb: 2 }}>
                  <InfoLabel label="Статус дела" />
                  <FormControl size="small" fullWidth>
                    <Select value={status || case_.status}
                      onChange={(e) => setStatus(e.target.value as CaseStatus)}
                      disabled={!canEditCase}
                      sx={{ borderRadius: "10px", fontSize: "14px",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: BORDER },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT } }}>
                      {Object.entries(statusLabels).map(([v, l]) => (
                        <MenuItem key={v} value={v}>{l}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {canEditCase && status && status !== case_.status && (
                    <Button fullWidth variant="contained" size="small" onClick={handleStatusUpdate}
                      disabled={patchCase.isPending}
                      sx={{ mt: 1, borderRadius: "9px", textTransform: "none", fontWeight: 600,
                        background: ACCENT, boxShadow: "none", "&:hover": { background: "#1D4ED8", boxShadow: "none" } }}>
                      {patchCase.isPending ? "Сохранение..." : "Сохранить статус"}
                    </Button>
                  )}
                </Box>

                {/* Dates */}
                <Stack spacing={1.5}>
                  <EditableField canEdit={canEditCase} field="start_date"
                    value={dayjs(case_.start_date).format("YYYY-MM-DD")}
                    displayValue={dayjs(case_.start_date).format("DD.MM.YYYY")}
                    label="Дата начала" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} type="date" />
                  <EditableField canEdit={canEditCase} field="deadline"
                    value={dayjs(case_.deadline).format("YYYY-MM-DD")}
                    displayValue={dayjs(case_.deadline).format("DD.MM.YYYY")}
                    label={hasOverdueWarning ? "⚠️ Срок (просрочен)" : "Срок исполнения"}
                    editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} type="date" />
                </Stack>

                {/* Meta dates */}
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${BORDER}` }}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <AccessTime sx={{ fontSize: 12, color: TEXT_MUTED }} />
                      <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>
                        Создано: {dayjs(case_.created_at).format("DD.MM.YYYY HH:mm")}
                      </Typography>
                    </Stack>
                    {case_.completion_date && (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <CheckCircle sx={{ fontSize: 12, color: SUCCESS }} />
                        <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>
                          Завершено: {dayjs(case_.completion_date).format("DD.MM.YYYY")}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Финансы" icon={<AccountBalance sx={{ fontSize: 18 }} />} />

                {/* Progress */}
                {costNum > 0 && (
                  <Box sx={{ mb: 2, p: 1.75, borderRadius: "12px",
                    background: progressPercent >= 100 ? SUCCESS_SOFT : SURFACE_2,
                    border: `1px solid ${progressPercent >= 100 ? SUCCESS_MID : BORDER}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <TrendingUp sx={{ fontSize: 14, color: progressPercent >= 100 ? SUCCESS : TEXT_SECONDARY }} />
                        <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY, fontWeight: 600 }}>Оплачено</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: "15px", fontWeight: 800,
                        color: progressPercent >= 100 ? SUCCESS : ACCENT,
                        fontFamily: '"JetBrains Mono", monospace' }}>
                        {Math.round(progressPercent)}%
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 8, borderRadius: 4, background: alpha(progressPercent >= 100 ? SUCCESS : ACCENT, 0.15) }}>
                      <Box sx={{ height: "100%", borderRadius: 4, width: `${progressPercent}%`,
                        background: progressPercent >= 100
                          ? `linear-gradient(90deg, ${SUCCESS} 0%, #22C55E 100%)`
                          : `linear-gradient(90deg, ${ACCENT} 0%, #60A5FA 100%)`,
                        transition: "width 0.4s ease" }} />
                    </Box>
                    <Stack direction="row" justifyContent="space-between" mt={0.75}>
                      <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>
                        {totalPaid.toLocaleString("ru-RU")} ₽
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>
                        {costNum.toLocaleString("ru-RU")} ₽
                      </Typography>
                    </Stack>
                  </Box>
                )}

                <Stack spacing={1.25}>
                  <EditableField canEdit={canEditCase} field="cost" value={case_.cost}
                    label="Стоимость дела" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} type="number" />
                  <EditableField canEdit={canEditCase} field="bank_transfer_amount" value={case_.bank_transfer_amount ?? ""}
                    label="Безналичная оплата" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} type="number" />
                  <EditableField canEdit={canEditCase} field="cash_amount" value={case_.cash_amount ?? ""}
                    label="Наличная оплата" editingField={editingField} editValues={editValues}
                    onEdit={handleFieldEdit} onSave={handleFieldSave} onCancel={handleFieldCancel} type="number" />

                  {/* Remaining debt highlight */}
                  <Box sx={{ p: 1.75, borderRadius: "12px",
                    background: remainingDebtNum > 0 ? DANGER_SOFT : SUCCESS_SOFT,
                    border: `1.5px solid ${remainingDebtNum > 0 ? DANGER_MID : SUCCESS_MID}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
                          textTransform: "uppercase", color: remainingDebtNum > 0 ? DANGER : SUCCESS, mb: "2px" }}>
                          Остаток долга
                        </Typography>
                        <Typography sx={{ fontSize: "20px", fontWeight: 800,
                          color: remainingDebtNum > 0 ? DANGER : SUCCESS,
                          fontFamily: '"JetBrains Mono", monospace', letterSpacing: "-0.5px" }}>
                          {remainingDebtNum.toLocaleString("ru-RU")} ₽
                        </Typography>
                      </Stack>
                      <Box sx={{ width: 36, height: 36, borderRadius: "10px",
                        background: remainingDebtNum > 0 ? DANGER_MID : SUCCESS_MID,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {remainingDebtNum > 0
                          ? <Warning sx={{ fontSize: 18, color: DANGER }} />
                          : <CheckCircle sx={{ fontSize: 18, color: SUCCESS }} />}
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Experts Card */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader title="Эксперты" count={assignedExperts.length} />

                {!isEditingExpert || !canManageExperts ? (
                  <Stack spacing={1.5}>
                    {selectedExperts.length > 0 ? (
                      <Stack spacing={0.75}>
                        {selectedExperts.map((expert) => (
                          <Box key={expert.id} sx={{ display: "flex", alignItems: "center", gap: 1.5,
                            px: 1.75, py: 1.25, borderRadius: "10px",
                            background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}` }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
                              background: `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                              {getInitials(expert.name)}
                            </Box>
                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: TEXT_PRIMARY, flex: 1 }}>
                              {expert.name}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box sx={{ py: 3, borderRadius: "10px", border: `1.5px dashed ${BORDER}`,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                        <Person sx={{ fontSize: 24, color: TEXT_MUTED }} />
                        <Typography sx={{ fontSize: "12.5px", color: TEXT_MUTED, fontWeight: 500, textAlign: "center" }}>
                          Эксперты не назначены
                        </Typography>
                      </Box>
                    )}
                    {canManageExperts && (
                      <Button size="small" startIcon={<Edit sx={{ fontSize: 13 }} />}
                        onClick={handleExpertEditStart}
                        sx={{ borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "12px",
                          color: ACCENT, border: `1px solid ${ACCENT_MID}`, background: ACCENT_SOFT,
                          "&:hover": { background: "#DBEAFE" } }}>
                        {selectedExperts.length > 0 ? "Изменить список" : "Назначить экспертов"}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Autocomplete
                      fullWidth multiple options={expertSuggestions}
                      getOptionLabel={(o) => o.name || ""}
                      value={draftExperts} inputValue={draftExpertInput}
                      loading={isExpertSuggestLoading} filterOptions={(o) => o} disablePortal
                      isOptionEqualToValue={(o, v) => o.id === v?.id}
                      noOptionsText={draftExpertInput.trim() === "" ? "Введите имя..." : isExpertSuggestLoading ? "Поиск..." : "Не найдено"}
                      onInputChange={(_e, val, reason) => {
                        setDraftExpertInput(val);
                        if (reason === "clear") clearExpertSuggestions();
                        else if (reason === "input") fetchExpertSuggestions(val);
                      }}
                      onChange={(_e, val) => setDraftExperts(val ?? [])}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>{option.name}</Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} size="small" placeholder="Добавить эксперта..."
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px",
                            "& fieldset": { borderColor: BORDER },
                            "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" } } }}
                          InputProps={{ ...params.InputProps, endAdornment: (
                            <>{isExpertSuggestLoading && <CircularProgress size={14} />}{params.InputProps.endAdornment}</>
                          )}} />
                      )}
                    />
                    <Stack direction="row" gap={1} justifyContent="flex-end">
                      <Button size="small" onClick={handleExpertEditCancel}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, color: TEXT_SECONDARY,
                          border: `1px solid ${BORDER}` }}>
                        Отмена
                      </Button>
                      <Button size="small" variant="contained" onClick={handleExpertSave}
                        disabled={updateCaseExperts.isPending}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600,
                          background: ACCENT, boxShadow: "none", "&:hover": { background: "#1D4ED8", boxShadow: "none" } }}>
                        {updateCaseExperts.isPending ? "..." : "Сохранить"}
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>

      {/* ── Drag overlay ─────────────────────────────────────────── */}
      {isDragActive && (
        <Box sx={{ position: "fixed", inset: 0, zIndex: 9999,
          background: alpha(ACCENT, 0.08), border: `2px dashed ${ACCENT}`,
          display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Box sx={{ px: 4, py: 2.5, borderRadius: "16px", background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}` }}>
            <Typography sx={{ fontSize: "16px", fontWeight: 700, color: ACCENT }}>
              Отпустите для загрузки файлов
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Hidden inputs ────────────────────────────────────────── */}
      <input type="file" multiple ref={fileInputRef} onChange={handleFileInputChange} style={{ display: "none" }} />
      <input type="file" multiple ref={folderInputRef} onChange={handleFolderInputChange} style={{ display: "none" }}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />

      {/* ── Upload Dialog ────────────────────────────────────────── */}
      <Dialog open={canEditCase && uploadDialogOpen}
        onClose={() => { setUploadDialogOpen(false); setSelectedFiles([]); setUploadTitle(""); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px", border: `1px solid ${BORDER}`, boxShadow: "0 20px 60px rgba(15,23,42,0.15)" } }}>
        <DialogTitle sx={{ fontSize: "16px", fontWeight: 700, color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}`, pb: 1.5 }}>
          Загрузка файлов
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2.5 }}>
          {isFolderUploadInProgress && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: "10px", background: ACCENT_SOFT, border: `1px solid ${ACCENT_MID}` }}>
              <Stack direction="row" justifyContent="space-between" mb={0.75}>
                <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>Загружается: {uploadingFileName}</Typography>
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: ACCENT }}>{uploadProgress}%</Typography>
              </Stack>
              <Box sx={{ height: 4, borderRadius: 4, background: ACCENT_MID }}>
                <Box sx={{ height: "100%", borderRadius: 4, width: `${uploadProgress}%`, background: ACCENT }} />
              </Box>
            </Box>
          )}
          <Stack spacing={2}>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => fileInputRef.current?.click()}
                startIcon={<Upload sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, flex: 1, borderColor: BORDER,
                  color: TEXT_SECONDARY, "&:hover": { borderColor: "#CBD5E1", background: SURFACE_2 } }}>
                Файлы
              </Button>
              <Button variant="outlined" onClick={() => void handleSelectFolders()}
                startIcon={<Folder sx={{ fontSize: 15 }} />}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, flex: 1, borderColor: BORDER,
                  color: TEXT_SECONDARY, "&:hover": { borderColor: "#CBD5E1", background: SURFACE_2 } }}>
                Папка
              </Button>
            </Stack>
            {selectedFiles.length > 0 && (
              <Box sx={{ maxHeight: 160, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 0.75,
                p: 1.5, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}` }}>
                {selectedFiles.map((file, i) => (
                  <Box key={i} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75,
                    px: 1, py: 0.5, borderRadius: "7px", background: SURFACE, border: `1px solid ${BORDER}` }}>
                    {getFileIcon(file.name)}
                    <Typography sx={{ fontSize: "12px", color: TEXT_PRIMARY, maxWidth: 140,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: TEXT_MUTED }}>({formatFileSize(file.size)})</Typography>
                    <IconButton size="small" onClick={() => setSelectedFiles((p) => p.filter((_, j) => j !== i))}
                      sx={{ p: 0.25, color: DANGER, "&:hover": { color: DANGER } }}>
                      <Cancel sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            <TextField fullWidth size="small" label="Название (необязательно)"
              value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Оставьте пустым для имён файлов"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "13px",
                "& fieldset": { borderColor: BORDER }, "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" } } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
          <Button onClick={() => { setUploadDialogOpen(false); setSelectedFiles([]); setUploadTitle(""); }}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, color: TEXT_SECONDARY,
              border: `1px solid ${BORDER}`, "&:hover": { background: SURFACE_2 } }}>
            Отмена
          </Button>
          <Button variant="contained"
            onClick={() => void uploadFilesAndFolders(selectedFiles)}
            disabled={selectedFiles.length === 0 || isFolderUploadInProgress || uploadDocument.isPending || createFolder.isPending}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, background: ACCENT,
              boxShadow: "none", "&:hover": { background: "#1D4ED8", boxShadow: "none" } }}>
            {isFolderUploadInProgress || uploadDocument.isPending || createFolder.isPending
              ? <CircularProgress size={18} sx={{ color: "#fff" }} />
              : `Загрузить (${selectedFiles.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}