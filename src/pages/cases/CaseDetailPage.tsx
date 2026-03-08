import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Alert,
  TextField,
  LinearProgress,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
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
  CalendarToday,
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
import type { CaseStatus } from "../../entities/case/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { notificationService } from "../../shared/services/notifications";
import { usePermissions } from "../../shared/hooks/usePermissions";
import { useExpertsSuggest } from "../../shared/hooks/useExpertsSuggest";

const statusLabels: Record<CaseStatus, string> = {
  archive: "Архив",
  in_work: "В работе",
  debt: "Долг",
  executed: "Выполнено",
  withdrawn: "Отозвано",
  cancelled: "Отменено",
  fssp: "ФССП",
};

const statusSeverity: Record<
  CaseStatus,
  "error" | "info" | "success" | "warning"
> = {
  archive: "info",
  in_work: "info",
  debt: "warning",
  executed: "success",
  withdrawn: "info",
  cancelled: "error",
  fssp: "info",
};

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
  const pathParts = relativePath.split("/").map((part) => part.toLowerCase());

  return (
    fileName.startsWith("~$") ||
    fileName.startsWith("._") ||
    fileName.startsWith("~") ||
    lowerName === ".ds_store" ||
    lowerName === "thumbs.db" ||
    lowerName === "desktop.ini" ||
    pathParts.includes("__macosx")
  );
};

const walkDirectoryHandle = async (
  directoryHandle: FileSystemDirectoryHandle,
  parentPath = "",
): Promise<File[]> => {
  const basePath = parentPath
    ? `${parentPath}/${directoryHandle.name}`
    : directoryHandle.name;
  const files: File[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      Object.defineProperty(file, "webkitRelativePath", {
        value: `${basePath}/${file.name}`,
        writable: false,
      });
      files.push(file);
      continue;
    }

    files.push(...(await walkDirectoryHandle(entry, basePath)));
  }

  return files;
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return (
        <PictureAsPdf
          sx={{
            color: "#D94343",
            filter: "drop-shadow(0 6px 10px rgba(217,67,67,0.28))",
          }}
        />
      );
    case "doc":
    case "docx":
      return (
        <Description
          sx={{
            color: "#4F90FF",
            filter: "drop-shadow(0 6px 10px rgba(79,144,255,0.24))",
          }}
        />
      );
    case "xls":
    case "xlsx":
      return (
        <Description
          sx={{
            color: "#4F90FF",
            filter: "drop-shadow(0 6px 10px rgba(79,144,255,0.24))",
          }}
        />
      );
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return (
        <Description
          sx={{
            color: "#4F90FF",
            filter: "drop-shadow(0 6px 10px rgba(79,144,255,0.24))",
          }}
        />
      );
    default:
      return (
        <InsertDriveFile
          sx={{
            color: "#7E8796",
            filter: "drop-shadow(0 6px 10px rgba(126,135,150,0.2))",
          }}
        />
      );
  }
};

const getFileTypeColor = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return "error";
    case "doc":
    case "docx":
      return "primary";
    default:
      return "default";
  }
};

interface FileWithRelativePath extends File {
  webkitRelativePath: string;
}

interface FileSystemEntryWebkit {
  isFile: boolean;
  isDirectory: boolean;
  fullPath: string;
  name: string;
}

interface FileSystemFileEntryWebkit extends FileSystemEntryWebkit {
  file: (
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

interface FileSystemDirectoryReaderWebkit {
  readEntries: (
    successCallback: (entries: FileSystemEntryWebkit[]) => void,
    errorCallback?: (error: DOMException) => void,
  ) => void;
}

interface FileSystemDirectoryEntryWebkit extends FileSystemEntryWebkit {
  createReader: () => FileSystemDirectoryReaderWebkit;
}

interface DataTransferItemWithEntry extends DataTransferItem {
  webkitGetAsEntry?: () => FileSystemEntryWebkit | null;
}

interface EditableFieldProps {
  field: string;
  value: string;
  displayValue?: string;
  label: string;
  editingField: string | null;
  editValues: Record<string, string>;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  multiline?: boolean;
  fullWidth?: boolean;
  type?: string;
  required?: boolean;
  canEdit?: boolean;
}

const EditableField = ({
  field,
  value,
  displayValue,
  label,
  editingField,
  editValues,
  onEdit,
  onSave,
  onCancel,
  multiline,
  fullWidth = true,
  type = "text",
  required = false,
  canEdit = true,
}: EditableFieldProps) => {
  const isEditing = canEdit && editingField === field;
  const currentValue = isEditing ? (editValues[field] ?? value) : value;
  const renderedValue = displayValue ?? value;
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 0.5, fontWeight: 500 }}
      >
        {label}
        {required && (
          <Typography component="span" color="error" sx={{ ml: 0.5 }}>
            *
          </Typography>
        )}
      </Typography>
      {isEditing ? (
        <Box
          display="flex"
          alignItems="flex-start"
          gap={1.5}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(79, 144, 255, 0.1)"
                : "rgba(79, 144, 255, 0.04)",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(79, 144, 255, 0.3)" : "rgba(79, 144, 255, 0.2)"}`,
          }}
        >
          <TextField
            size="small"
            value={currentValue}
            onChange={(e) => onEdit(field, e.target.value)}
            multiline={multiline}
            rows={multiline ? 3 : 1}
            fullWidth={fullWidth}
            type={type}
            autoFocus
            sx={{
              flexGrow: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
              },
            }}
          />
          <Tooltip title="Сохранить">
            <IconButton
              size="small"
              onClick={() => onSave(field)}
              color="success"
              sx={{ mt: multiline ? 1 : 0 }}
            >
              <Save fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Отменить">
            <IconButton
              size="small"
              onClick={onCancel}
              color="error"
              sx={{ mt: multiline ? 1 : 0 }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(148, 163, 184, 0.08)"
                : "rgba(148, 163, 184, 0.08)",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(148,163,184,0.28)" : "rgba(148,163,184,0.35)"}`,
            minHeight: 48,
            cursor: canEdit ? "pointer" : "default",
            transition: "all 0.2s",
            ...(canEdit
              ? {
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(79, 144, 255, 0.16)"
                        : "rgba(79, 144, 255, 0.1)",
                    borderColor: theme.palette.primary.main,
                    boxShadow: theme.shadows[2],
                  },
                }
              : {}),
          }}
          onClick={canEdit ? () => onEdit(field, value) : undefined}
        >
          <Typography
            variant="body1"
            sx={{
              flexGrow: 1,
              color: renderedValue ? "text.primary" : "text.disabled",
              minHeight: 24,
            }}
          >
            {renderedValue || "—"}
          </Typography>
          {canEdit && (
            <Tooltip title="Редактировать">
              <IconButton size="small" color="primary">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

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
  const theme = useTheme();
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
  const [isFolderUploadInProgress, setIsFolderUploadInProgress] =
    useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [selectedExperts, setSelectedExperts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isEditingExpert, setIsEditingExpert] = useState(false);
  const [draftExperts, setDraftExperts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [draftExpertInput, setDraftExpertInput] = useState("");
  const {
    suggestions: expertSuggestions,
    isLoading: isExpertSuggestLoading,
    fetchSuggestions: fetchExpertSuggestions,
    clearSuggestions: clearExpertSuggestions,
  } = useExpertsSuggest();

  useEffect(() => {
    if (!caseData) return;

    setStatus((prev) =>
      prev !== caseData.case.status ? caseData.case.status : prev,
    );

    const currentExperts = (caseData.experts ?? []).map((expert) => ({
      id: expert.id,
      name: expert.full_name,
    }));

    setSelectedExperts(currentExperts);
    setDraftExperts(currentExperts);
    setDraftExpertInput("");
  }, [caseData]);

  useEffect(() => {
    if (patchCase.isSuccess) {
      notificationService.success("Изменения успешно сохранены");
    }
  }, [patchCase.isSuccess]);

  useEffect(() => {
    if (patchCase.isError) {
      notificationService.error("Ошибка при сохранении изменений");
    }
  }, [patchCase.isError]);

  const case_ = caseData?.case;
  const client = caseData?.client;
  const assignedExperts = caseData?.experts ?? [];
  const documents = caseData?.documents ?? [];
  const folders = caseData?.folders ?? [];

  const buildFolderPathQuery = useCallback(
    (targetFolderId: string) => {
      const folderById = new Map(folders.map((folder) => [folder.id, folder]));
      const chain: Array<{ id: string; name: string }> = [];

      let currentId: string | undefined = targetFolderId;
      while (currentId) {
        const currentFolder = folderById.get(currentId);
        if (!currentFolder) break;
        chain.unshift({ id: currentFolder.id, name: currentFolder.name });
        currentId = currentFolder.parent_id;
      }

      return encodeURIComponent(JSON.stringify(chain));
    },
    [folders],
  );
  const events = caseData?.events ?? [];

  const costNum = Number(case_?.cost) || 0;
  const bankNum = Number(case_?.bank_transfer_amount) || 0;
  const cashNum = Number(case_?.cash_amount) || 0;
  const remainingDebtNum = Number(case_?.remaining_debt) || 0;
  const totalPaid = bankNum + cashNum;
  const progressPercent =
    costNum > 0 ? Math.min(100, (totalPaid / costNum) * 100) : 0;

  const uploadFilesAndFolders = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => !isSystemOrTempFile(file));
      if (validFiles.length === 0) {
        notificationService.warning("Нет подходящих файлов для загрузки");
        return;
      }

      setIsFolderUploadInProgress(true);

      try {
        const folderPaths = new Set<string>();

        validFiles.forEach((file) => {
          const relativePath = file.webkitRelativePath || file.name;
          const pathParts = relativePath.split("/").slice(0, -1);

          for (let i = 1; i <= pathParts.length; i += 1) {
            folderPaths.add(pathParts.slice(0, i).join("/"));
          }
        });

        const sortedFolders = Array.from(folderPaths).sort(
          (a, b) => a.split("/").length - b.split("/").length,
        );
        const folderIdByPath = new Map<string, string>();

        for (const folderPath of sortedFolders) {
          const pathParts = folderPath.split("/");
          const folderName = pathParts[pathParts.length - 1];
          const parentPath = pathParts.slice(0, -1).join("/");
          const parentId = parentPath
            ? (folderIdByPath.get(parentPath) ?? null)
            : null;

          const createdFolder = await createFolder.mutateAsync({
            name: folderName,
            parent_id: parentId,
            case_id: parentId ? null : caseData?.case?.id,
          });

          folderIdByPath.set(folderPath, createdFolder.id);
        }

        const totalFiles = validFiles.length;
        const maxConcurrency = Math.min(4, totalFiles);
        const progressByFile = new Map<number, number>();
        validFiles.forEach((_, index) => progressByFile.set(index, 0));

        const updateOverallProgress = () => {
          const total = Array.from(progressByFile.values()).reduce(
            (sum, value) => sum + value,
            0,
          );
          setUploadProgress(Math.round(total / totalFiles));
        };

        let nextIndex = 0;
        const worker = async () => {
          while (nextIndex < totalFiles) {
            const fileIndex = nextIndex;
            nextIndex += 1;

            const file = validFiles[fileIndex];
            const relativePath = file.webkitRelativePath || file.name;
            const folderPath = relativePath.split("/").slice(0, -1).join("/");
            const folderId = folderPath
              ? (folderIdByPath.get(folderPath) ?? null)
              : null;

            setUploadingFileName(file.name);

            await uploadDocument.mutateAsync({
              file,
              folder_id: folderId,
              case_id: folderId ? null : caseData?.case?.id,
              title: uploadTitle || file.name,
              onUploadProgress: (fileProgress) => {
                progressByFile.set(fileIndex, fileProgress);
                updateOverallProgress();
              },
            });

            progressByFile.set(fileIndex, 100);
            updateOverallProgress();
          }
        };

        await Promise.all(
          Array.from({ length: maxConcurrency }, () => worker()),
        );

        setUploadProgress(100);
        setSelectedFiles([]);
        setUploadTitle("");
        setUploadDialogOpen(false);
        await refetch();
        notificationService.success(
          `Успешно загружено: ${sortedFolders.length} папок и ${validFiles.length} файлов`,
        );
      } catch (error) {
        console.error("Ошибка загрузки файлов и папок:", error);
        notificationService.error("Ошибка загрузки файлов и папок");
      } finally {
        setIsFolderUploadInProgress(false);
        setUploadingFileName("");
        setTimeout(() => setUploadProgress(0), 500);
      }
    },
    [caseData?.case?.id, createFolder, refetch, uploadDocument, uploadTitle],
  );

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDragActive(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragActive(false);
      }
    };

    const handleDrop = async (event: DragEvent) => {
      if (!event.dataTransfer) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragActive(false);

      const droppedFiles = await extractDroppedFiles(event.dataTransfer);
      const filteredDroppedFiles = droppedFiles.filter(
        (file) => !isSystemOrTempFile(file),
      );
      await uploadFilesAndFolders(filteredDroppedFiles);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [uploadFilesAndFolders]);

  // ─── Ранние return ПОСЛЕ всех хуков ───────────────────────────────────────
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(100vh - 120px)"
        sx={{ bgcolor: "background.default" }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} color="primary" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Загрузка дела...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !caseData || !case_ || !client) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/crm/cases")}
            >
              К списку дел
            </Button>
          }
        >
          Дело не найдено
        </Alert>
      </Box>
    );
  }

  const isOverdue = dayjs(case_.deadline).isBefore(dayjs(), "day");
  const statusesWithoutOverdueWarning: CaseStatus[] = [
    "debt",
    "executed",
    "fssp",
    "archive",
    "withdrawn",
  ];
  const isCompleted = statusesWithoutOverdueWarning.includes(case_.status);
  const hasCompletionDate = !!case_.completion_date;
  const hasOverdueWarning = isOverdue && !isCompleted;
  const statusVariant = hasOverdueWarning
    ? "error"
    : statusSeverity[case_.status];
  const bannerAccentColor = theme.palette[statusVariant].main;

  const handleStatusUpdate = () => {
    if (!canEditCase) return;
    if (status && status !== case_.status) {
      patchCase.mutate({ id: case_.id, data: { status } });
    }
  };

  const handleExpertEditStart = () => {
    if (!canManageExperts) return;
    setIsEditingExpert(true);
    setDraftExperts(selectedExperts);
    setDraftExpertInput("");
  };

  const handleExpertEditCancel = () => {
    setIsEditingExpert(false);
    setDraftExperts(selectedExperts);
    setDraftExpertInput("");
    clearExpertSuggestions();
  };

  const handleExpertSave = () => {
    if (!canManageExperts) return;

    const currentIds = [...selectedExperts.map((expert) => expert.id)].sort();
    const nextIds = [...draftExperts.map((expert) => expert.id)].sort();

    if (JSON.stringify(currentIds) === JSON.stringify(nextIds)) {
      handleExpertEditCancel();
      return;
    }

    updateCaseExperts.mutate(
      {
        id: case_.id,
        data: { expert_ids: draftExperts.map((expert) => expert.id) },
      },
      {
        onSuccess: () => {
          setSelectedExperts(draftExperts);
          setIsEditingExpert(false);
          clearExpertSuggestions();
          notificationService.success("Список экспертов обновлен");
        },
        onError: () => {
          notificationService.error("Не удалось обновить список экспертов");
        },
      },
    );
  };

  const handleFieldEdit = (field: string, value: string) => {
    if (!canEditCase) return;
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  };

  const handleFieldSave = (field: string) => {
    if (!canEditCase) return;
    const value = editValues[field];
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { [field]: value };
      if (["cost", "bank_transfer_amount", "cash_amount"].includes(field)) {
        const cost = field === "cost" ? Number(value) : costNum;
        const bankAmount =
          field === "bank_transfer_amount" ? Number(value) : bankNum;
        const cashAmount = field === "cash_amount" ? Number(value) : cashNum;
        const remainingDebt = Math.max(0, cost - bankAmount - cashAmount);
        updateData.remaining_debt = remainingDebt.toString();
      }
      patchCase.mutate({
        id: case_.id,
        data: updateData,
      });
      setEditingField(null);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const filteredFiles = files.filter((file) => !isSystemOrTempFile(file));
      setSelectedFiles((prev) => [...prev, ...filteredFiles]);
    }
    e.target.value = "";
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const filteredFiles = files.filter((file) => !isSystemOrTempFile(file));
      setSelectedFiles((prev) => [...prev, ...filteredFiles]);
    }
    e.target.value = "";
  };

  const handleSelectFolders = async () => {
    const pickerWindow = window as Window & {
      showDirectoryPicker?: (options?: {
        mode?: "read" | "readwrite";
        multiple?: boolean;
      }) => Promise<FileSystemDirectoryHandle | FileSystemDirectoryHandle[]>;
    };

    if (!pickerWindow.showDirectoryPicker) {
      folderInputRef.current?.click();
      return;
    }

    try {
      const selected = await pickerWindow.showDirectoryPicker({
        mode: "read",
        multiple: true,
      });
      const handles = Array.isArray(selected) ? selected : [selected];
      const fileGroups = await Promise.all(
        handles.map((handle) => walkDirectoryHandle(handle)),
      );
      const files = fileGroups
        .flat()
        .filter((file) => !isSystemOrTempFile(file));

      if (files.length === 0) {
        notificationService.warning("Нет подходящих файлов для загрузки");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);
      setUploadDialogOpen(true);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
      notificationService.error("Не удалось выбрать папки");
    }
  };

  const readDirectoryEntries = (
    directoryEntry: FileSystemDirectoryEntryWebkit,
  ): Promise<FileSystemEntryWebkit[]> => {
    const reader = directoryEntry.createReader();

    return new Promise((resolve, reject) => {
      const entries: FileSystemEntryWebkit[] = [];

      const readChunk = () => {
        reader.readEntries(
          (chunk) => {
            if (chunk.length === 0) {
              resolve(entries);
              return;
            }

            entries.push(...chunk);
            readChunk();
          },
          (error) => reject(error),
        );
      };

      readChunk();
    });
  };

  const walkEntryRecursively = async (
    entry: FileSystemEntryWebkit,
  ): Promise<FileWithRelativePath[]> => {
    if (entry.isFile) {
      return new Promise((resolve, reject) => {
        (entry as FileSystemFileEntryWebkit).file(
          (file) => {
            const relativePath = entry.fullPath.startsWith("/")
              ? entry.fullPath.slice(1)
              : entry.fullPath;
            Object.defineProperty(file, "webkitRelativePath", {
              value: relativePath,
              configurable: true,
            });
            resolve([file as FileWithRelativePath]);
          },
          (error) => reject(error),
        );
      });
    }

    if (entry.isDirectory) {
      const childEntries = await readDirectoryEntries(
        entry as FileSystemDirectoryEntryWebkit,
      );
      const nestedFiles = await Promise.all(
        childEntries.map((child) => walkEntryRecursively(child)),
      );
      return nestedFiles.flat();
    }

    return [];
  };

  const extractDroppedFiles = async (
    dataTransfer: DataTransfer,
  ): Promise<FileWithRelativePath[]> => {
    const items = Array.from(dataTransfer.items || []);

    if (items.length > 0) {
      const fileGroups = await Promise.all(
        items.map(async (item) => {
          const itemWithEntry = item as DataTransferItemWithEntry;
          const entry = itemWithEntry.webkitGetAsEntry?.();

          if (entry) {
            return walkEntryRecursively(entry);
          }

          const file = item.getAsFile();
          if (!file) return [];
          return [file as FileWithRelativePath];
        }),
      );

      return fileGroups.flat();
    }

    return Array.from(dataTransfer.files || []) as FileWithRelativePath[];
  };

  const handleUpload = async () => {
    await uploadFilesAndFolders(selectedFiles);
  };

  const handleDownload = (documentId: string) => {
    setDownloadLabel("Скачивание файла");
    setDownloadProgress(0);

    downloadDocument.mutate(
      {
        documentId,
        onDownloadProgress: (progress) => setDownloadProgress(progress),
      },
      {
        onSettled: () => {
          setTimeout(() => {
            setDownloadProgress(0);
            setDownloadLabel("");
          }, 500);
        },
      },
    );
  };

  const handlePreview = (documentId: string) => {
    previewDocument.mutate(documentId);
  };

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        p: { xs: 2, sm: 3 },
        minHeight: "calc(100vh - 120px)",
        borderRadius: 4,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(30,41,59,0.45) 0%, rgba(15,23,42,0.25) 100%)"
            : "linear-gradient(180deg, rgba(79,144,255,0.08) 0%, rgba(15,23,42,0.03) 100%)",
        "@keyframes cardIn": {
          "0%": { opacity: 0, transform: "translateY(12px) scale(0.95)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "@keyframes fadeSlideIn": {
          "0%": { opacity: 0, transform: "translateY(-8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Navigation Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          boxShadow: 1,
          animation: "fadeSlideIn 320ms ease",
          transition: "box-shadow 220ms ease, transform 220ms ease",
          "&:hover": {
            boxShadow: 3,
            transform: "translateY(-1px)",
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Назад к списку дел">
            <IconButton onClick={() => navigate("/crm/cases")} size="small">
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" color="text.secondary">
            Дела
          </Typography>
          <Typography variant="h6">/</Typography>
          <Typography variant="h6" fontWeight="bold">
            {case_.case_number}
          </Typography>
        </Box>
      </Box>

      {/* Status Banner */}
      <Alert
        severity={statusVariant}
        icon={hasOverdueWarning ? <Warning /> : <CheckCircle />}
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 2,
          animation: "fadeSlideIn 360ms ease",
          transition: "transform 220ms ease, box-shadow 220ms ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: 4,
          },
          "& .MuiAlert-message": {
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          },
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {hasOverdueWarning
              ? "⚠️ Срок исполнения просрочен"
              : statusLabels[case_.status]}
          </Typography>
          <Typography variant="body2">
            {hasOverdueWarning
              ? `Срок был ${dayjs(case_.deadline).format("DD.MM.YYYY")}`
              : hasCompletionDate
                ? `Завершено: ${dayjs(case_.completion_date).format("DD.MM.YYYY")}`
                : `Срок исполнения: ${dayjs(case_.deadline).format("DD.MM.YYYY")}`}
          </Typography>
        </Box>
        {case_.case_type && case_.object_type && (
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 2,
              p: 1,
              bgcolor: alpha(bannerAccentColor, 0.12),
              border: `1px solid ${alpha(bannerAccentColor, 0.25)}`,
              borderRadius: 2,
            }}
          >
            <Chip
              label={case_.case_type}
              size="small"
              variant="filled"
              sx={{
                bgcolor: alpha(bannerAccentColor, 0.15),
                color: bannerAccentColor,
                fontWeight: 600,
              }}
            />
            <Chip
              label={case_.object_type}
              size="small"
              variant="filled"
              sx={{
                bgcolor: alpha(bannerAccentColor, 0.22),
                color: bannerAccentColor,
                fontWeight: 600,
              }}
            />
          </Box>
        )}
      </Alert>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Case Information Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: 2,
              animation: "cardIn 420ms ease",
              transformOrigin: "center",
            }}
          >
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Assignment sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Основная информация
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    canEdit={canEditCase}
                    field="number"
                    value={case_.number}
                    label="№ п/п"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    canEdit={canEditCase}
                    field="case_number"
                    value={case_.case_number}
                    label="Номер дела"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    canEdit={canEditCase}
                    field="authority"
                    value={case_.authority}
                    label="Суд/Орган"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <EditableField
                    canEdit={canEditCase}
                    field="object_address"
                    value={case_.object_address}
                    label="Адрес объекта"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    canEdit={canEditCase}
                    field="judge_name"
                    value={case_.judge_name || ""}
                    label="ФИО судьи"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                {case_.plaintiff && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EditableField
                      canEdit={canEditCase}
                      field="plaintiff"
                      value={case_.plaintiff}
                      label="Истец"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                    />
                  </Grid>
                )}
                {case_.defendant && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EditableField
                      canEdit={canEditCase}
                      field="defendant"
                      value={case_.defendant}
                      label="Ответчик"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                    />
                  </Grid>
                )}
                {case_.remarks && (
                  <Grid size={{ xs: 12 }}>
                    <EditableField
                      canEdit={canEditCase}
                      field="remarks"
                      value={case_.remarks}
                      label="Примечания"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                      multiline
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Client Information Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: 2,
              animation: "cardIn 420ms ease",
              animationDelay: "470ms",
              animationFillMode: "both",
            }}
          >
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Business sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Клиент
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 4 }}>
              <Box
                display="flex"
                alignItems="center"
                gap={2.5}
                mb={3}
                p={2}
                sx={{ bgcolor: "background.default", borderRadius: 2 }}
              >
                <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64 }}>
                  {client.type === "legal" ? (
                    <Business fontSize="large" />
                  ) : (
                    <Person fontSize="large" />
                  )}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {client.name}
                  </Typography>
                  {client.short_name && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {client.short_name}
                    </Typography>
                  )}
                  <Chip
                    label={
                      client.type === "legal"
                        ? "Юридическое лицо"
                        : client.type === "individual"
                          ? "Физическое лицо"
                          : "Суд"
                    }
                    size="small"
                    variant="outlined"
                    color={client.type === "legal" ? "primary" : "secondary"}
                  />
                </Box>
              </Box>
              <Grid container spacing={2.5}>
                {client.inn && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      ИНН
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body1">{client.inn}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.email && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Email
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "background.default",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Email fontSize="small" color="action" />
                      <Typography variant="body1">{client.email}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.phone && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Телефон
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "background.default",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body1">{client.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.legal_address && (
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Юридический адрес
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body1">
                        {client.legal_address}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              {client.contacts.length > 0 && (
                <Box mt={3}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ mb: 2 }}
                  >
                    Контактные лица
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {client.contacts.map((contact) => (
                      <ListItem
                        key={contact.id}
                        sx={{
                          px: 0,
                          py: 1.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {contact.name}
                            </Typography>
                          }
                          disableTypography
                          secondary={
                            <Box component="div" sx={{ mt: 0.5 }}>
                              {contact.position && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  display="block"
                                >
                                  {contact.position}
                                </Typography>
                              )}
                              {contact.email && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mt: 0.5,
                                  }}
                                >
                                  <Email fontSize="small" color="action" />
                                  {contact.email}
                                </Typography>
                              )}
                              {contact.phone && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mt: 0.5,
                                  }}
                                >
                                  <Phone fontSize="small" color="action" />
                                  {contact.phone}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {contact.is_main && (
                          <Chip
                            label="Основной"
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ height: 24 }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: 2,
              animation: "cardIn 420ms ease",
              animationDelay: "520ms",
              animationFillMode: "both",
            }}
          >
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Description sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Файлы дела ({folders.length + documents.length})
                  </Typography>
                </Box>
              }
              action={
                <Box display="flex" gap={1}>
                  {canEditCase && (
                    <Tooltip title="Загрузить файлы">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        <Upload />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Скачать все документы">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDownloadLabel("Скачивание документов дела (ZIP)");
                        setDownloadProgress(0);
                        downloadCaseDocuments.mutate(
                          {
                            caseId: case_.id,
                            onDownloadProgress: (progress) =>
                              setDownloadProgress(progress),
                          },
                          {
                            onSettled: () => {
                              setTimeout(() => {
                                setDownloadProgress(0);
                                setDownloadLabel("");
                              }, 500);
                            },
                          },
                        );
                      }}
                    >
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 0 }}>
              {(downloadDocument.isPending ||
                downloadCaseDocuments.isPending) && (
                <Box sx={{ px: 2, pt: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {downloadLabel || "Скачивание"}
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      {downloadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={downloadProgress}
                  />
                </Box>
              )}
              {folders.length === 0 && documents.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Description
                    sx={{ fontSize: 48, color: "action.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Нет файлов
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Добавьте папки или загрузите первые документы по этому делу
                  </Typography>
                  {canEditCase && (
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Загрузить файлы
                    </Button>
                  )}
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {folders.map((folder) => (
                    <ListItem
                      key={`folder-${folder.id}`}
                      divider
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                      onClick={() =>
                        navigate(
                          `/crm/documents?folderId=${folder.id}&folderName=${encodeURIComponent(folder.name)}&folderPath=${buildFolderPathQuery(folder.id)}`,
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.18),
                            color: theme.palette.warning.main,
                            width: 44,
                            height: 44,
                          }}
                        >
                          <Folder />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {folder.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            Папка • ID: {folder.id}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {documents.map((doc) => (
                    <ListItem
                      key={doc.id}
                      divider
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                      onDoubleClick={() => handlePreview(doc.id)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getFileTypeColor(doc.original_filename),
                            width: 44,
                            height: 44,
                          }}
                        >
                          {getFileIcon(doc.original_filename)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {doc.title}
                          </Typography>
                        }
                        disableTypography
                        secondary={
                          <Box component="div" sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {doc.original_filename} •{" "}
                              {formatFileSize(doc.file_size)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              Загружен:{" "}
                              {dayjs(doc.created_at).format("DD.MM.YYYY HH:mm")}
                              {doc.uploaded_by &&
                                ` • ${doc.uploaded_by.full_name}`}
                            </Typography>
                            {doc.folder && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                sx={{ mt: 0.5 }}
                              >
                                <Folder fontSize="small" />
                                Папка: {doc.folder.name}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Просмотр">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handlePreview(doc.id)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Скачать">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDownload(doc.id)}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Events Card */}
          {events.length > 0 && (
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Email sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" fontWeight="bold">
                      События ({events.length})
                    </Typography>
                  </Box>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ p: 0 }}>
                  {events.map((event) => (
                    <ListItem
                      key={event.id}
                      divider
                      sx={{
                        px: 2,
                        py: 2,
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            fontWeight="medium"
                            gutterBottom
                          >
                            {event.subject}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ width: "100%" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                mb: 1.5,
                                p: 1.5,
                                bgcolor: "background.default",
                                borderRadius: 1,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {event.body}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <CalendarToday fontSize="small" />
                                {dayjs(event.sent_at).format(
                                  "DD.MM.YYYY HH:mm",
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Email fontSize="small" />
                                {event.direction}
                              </Box>
                              {event.sender && <Box>От: {event.sender}</Box>}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              boxShadow: 2,
              transition: "transform 240ms ease, box-shadow 240ms ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  Состояние
                </Typography>
              }
            />
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 2.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Статус дела</InputLabel>
                  <Select
                    value={status || case_.status}
                    label="Статус дела"
                    onChange={(e) => setStatus(e.target.value as CaseStatus)}
                    disabled={!canEditCase}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {canEditCase && status && status !== case_.status && (
                  <Box mt={1.5}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={handleStatusUpdate}
                      disabled={patchCase.isPending}
                    >
                      {patchCase.isPending
                        ? "Сохранение..."
                        : "Сохранить статус"}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: "background.default",
                  borderRadius: 2,
                }}
              >
                <EditableField
                  canEdit={canEditCase}
                  field="start_date"
                  value={dayjs(case_.start_date).format("YYYY-MM-DD")}
                  displayValue={dayjs(case_.start_date).format("DD.MM.YYYY")}
                  label="Дата начала"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="date"
                />
              </Box>

              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: "background.default",
                  borderRadius: 2,
                }}
              >
                <EditableField
                  canEdit={canEditCase}
                  field="deadline"
                  value={dayjs(case_.deadline).format("YYYY-MM-DD")}
                  displayValue={dayjs(case_.deadline).format("DD.MM.YYYY")}
                  label={
                    hasOverdueWarning ? "Срок просрочен" : "Срок исполнения"
                  }
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="date"
                />
              </Box>

              {costNum > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Оплата
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        fontFamily:
                          '"JetBrains Mono", "Roboto Mono", monospace',
                      }}
                    >
                      {Math.round(progressPercent)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 13,
                      borderRadius: 8,
                      bgcolor: "rgba(148,163,184,0.2)",
                      "& .MuiLinearProgress-bar": {
                        background:
                          "linear-gradient(90deg, #94A3B8 0%, #22C55E 100%)",
                        borderRadius: 8,
                      },
                    }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  canEdit={canEditCase}
                  field="cost"
                  value={case_.cost}
                  label="Стоимость дела"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  canEdit={canEditCase}
                  field="bank_transfer_amount"
                  value={case_.bank_transfer_amount}
                  label="Безналичная оплата"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  canEdit={canEditCase}
                  field="cash_amount"
                  value={case_.cash_amount}
                  label="Наличная оплата"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor:
                    remainingDebtNum > 0
                      ? "rgba(244,67,54,0.08)"
                      : "rgba(76,175,80,0.08)",
                  borderRadius: 2,
                  border: `1px solid ${remainingDebtNum > 0 ? theme.palette.error.main : theme.palette.success.main}`,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5, fontWeight: 500 }}
                >
                  Остаток долга
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={remainingDebtNum > 0 ? "error" : "success"}
                  sx={{
                    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                  }}
                >
                  {remainingDebtNum.toLocaleString("ru-RU")} ₽
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Assigned Experts Card */}
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  Назначенные эксперты ({assignedExperts.length})
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {!isEditingExpert || !canManageExperts ? (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "background.default",
                    minHeight: 48,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      flexGrow: 1,
                      color: selectedExperts.length > 0 ? "text.primary" : "text.disabled",
                    }}
                  >
                    {selectedExperts.length > 0
                      ? selectedExperts.map((expert) => expert.name).join(", ")
                      : "—"}
                  </Typography>
                  {canManageExperts && (
                    <Tooltip title="Редактировать">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={handleExpertEditStart}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ) : (
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={1.5}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(79, 144, 255, 0.1)"
                        : "rgba(79, 144, 255, 0.04)",
                    border: `1px solid ${theme.palette.mode === "dark" ? "rgba(79, 144, 255, 0.3)" : "rgba(79, 144, 255, 0.2)"}`,
                    mb: 2,
                  }}
                >
                  <Autocomplete
                    fullWidth
                    options={expertSuggestions}
                    getOptionLabel={(option) => option.name || ""}
                    multiple
                    value={draftExperts}
                    inputValue={draftExpertInput}
                    loading={isExpertSuggestLoading}
                    filterOptions={(options) => options}
                    noOptionsText={
                      draftExpertInput.trim().length === 0
                        ? "Начните ввод для поиска..."
                        : isExpertSuggestLoading
                          ? "Поиск..."
                          : "Эксперты не найдены"
                    }
                    onInputChange={(_e, newInputValue, reason) => {
                      setDraftExpertInput(newInputValue);
                      if (reason === "clear") {
                        clearExpertSuggestions();
                      } else if (reason === "input") {
                        fetchExpertSuggestions(newInputValue);
                      }
                    }}
                    onChange={(_e, value) => {
                      setDraftExperts(value ?? []);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Назначенные эксперты"
                        placeholder="Введите имя эксперта..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isExpertSuggestLoading ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ flexGrow: 1 }}
                  />
                  <Tooltip title="Сохранить">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={handleExpertSave}
                    >
                      <Save fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Отменить">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleExpertEditCancel}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {selectedExperts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Эксперты пока не назначены.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isDragActive && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: theme.zIndex.modal + 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `2px dashed ${theme.palette.primary.main}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="primary">
            Отпустите, чтобы загрузить файлы или папку
          </Typography>
        </Box>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />
      <input
        type="file"
        multiple
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        style={{ display: "none" }}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
      />

      {/* Upload Dialog */}
      <Dialog
        open={canEditCase && uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadTitle("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузка файлов и папок</DialogTitle>
        <DialogContent>
          {isFolderUploadInProgress && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Загружается: {uploadingFileName || "файл"}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {uploadProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
              >
                Выбрать файлы
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleSelectFolders()}
              >
                Выбрать папку(и)
              </Button>
            </Box>
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Выбранные элементы ({selectedFiles.length}):
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={`${file.name} (${formatFileSize(file.size)})`}
                      sx={{ m: 0.5 }}
                      onDelete={() => {
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              fullWidth
              label="Название для всех файлов (необязательно)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Оставьте пустым для использования имён файлов"
              helperText="Если указано, будет использовано для всех файлов"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFiles([]);
              setUploadTitle("");
            }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={
              selectedFiles.length === 0 ||
              isFolderUploadInProgress ||
              uploadDocument.isPending ||
              createFolder.isPending
            }
          >
            {isFolderUploadInProgress ||
            uploadDocument.isPending ||
            createFolder.isPending ? (
              <CircularProgress size={20} />
            ) : (
              `Загрузить ${selectedFiles.length} элемент(ов)`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
