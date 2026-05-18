import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Menu,
  IconButton,
  TableSortLabel,
  Tooltip,
  Skeleton,
  Autocomplete,
  alpha,
  Checkbox,
  Stack,
  Tabs,
  Tab,
  List,
  ListItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  DeleteSweep,
  Download,
  FolderOutlined,
  DescriptionOutlined,
  CreateNewFolder,
  Upload,
  MoreVert,
  Home,
  Search,
  Person,
  Visibility,
  Edit,
  OpenInNew,
  Share,
  Group,
  Link as LinkIcon,
  MoveToInbox,
  Close,
  Mail,
} from "@mui/icons-material";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useCreateFolder,
  useUploadDocument,
  useDownloadDocument,
  useDocuments,
  useCaseSuggestions,
  usePreviewDocument,
  useUpdateAsset,
  useDownloadFolder,
  useDownloadBulkAssets,
  useTrashAssets,
} from "../../shared/hooks/useDocuments";
import type { FileSystemEntry } from "../../entities/document/types";
import type { CaseSuggestion } from "../../entities/case/types";
import { EditAssetDialog } from "../../shared/ui/EditAssetDialog";
import { notificationService } from "../../shared/services/notifications";
import { PaginationControls } from "../../shared/ui/PaginationControls";
import { usePermissions } from "../../shared/hooks/usePermissions";
import { usersApi } from "../../entities/user/api";
import { useCreateLinkShare, useCreateUserShare, useRevokeShare, useShareResource } from "../../shared/hooks/useShare";
import type { UserRead } from "../../entities/user/types";
import { DocumentModeSwitcher, type DocumentMode } from "../../shared/ui/DocumentModeSwitcher";
import { EmailDocumentsView } from "./EmailDocumentsView";
import { useMailAttachments } from "../../shared/hooks/useMailAttachments";
import type { MailAttachmentsListParams } from "../../entities/mail/types";

type SortField = "name" | "size" | "created_at" | "created_by";
type SortOrder = "asc" | "desc";

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

const sanitizeAndRender = (str: string) => DOMPurify.sanitize(str);

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

  const handle = directoryHandle as any;
  for await (const entry of handle.values()) {
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

const actionButtonSx = {
  textTransform: "none",
  minHeight: 40,
  px: 2,
  borderRadius: 1.5,
  fontWeight: 600,
};

export function DocumentsPage() {
  // Mode switching
  const [activeMode, setActiveMode] = useState<DocumentMode>("storage");
  const [emailPage, setEmailPage] = useState(0);
  const [emailRowsPerPage, setEmailRowsPerPage] = useState(25);
  const [emailSortField, setEmailSortField] = useState<"filename" | "created_at" | "file_size">("created_at");
  const [emailSortOrder, setEmailSortOrder] = useState<"asc" | "desc">("desc");
  const [emailAttachmentType, setEmailAttachmentType] = useState<"all" | "incoming" | "outgoing">("all");

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "Корень" }]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEntry, setMenuEntry] = useState<FileSystemEntry | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<FileSystemEntry | null>(
    null,
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<FileSystemEntry | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [_uploadCaseId, setUploadCaseId] = useState<string>("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState<"my" | "all">("my");
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseSuggestion | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOverTable, setDragOverTable] = useState(false);
  const [dragOverUploadDialog, setDragOverUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingLabel, setDownloadingLabel] = useState("");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverFolderPathIndex, setDragOverFolderPathIndex] = useState<
    number | null
  >(null);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(
    null,
  );
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [isRubberBandSelecting, setIsRubberBandSelecting] = useState(false);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInfoOpen, setShareInfoOpen] = useState(false);
  const [shareEntry, setShareEntry] = useState<FileSystemEntry | null>(null);
  const [shareTab, setShareTab] = useState(0);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientOptions, setRecipientOptions] = useState<UserRead[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<UserRead[]>([]);
  const [permissionLevel, setPermissionLevel] = useState<"view" | "edit">("view");
  const [canDownloadShare, setCanDownloadShare] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const tableAreaRef = useRef<HTMLDivElement>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionFrameEntriesRef = useRef<
    Array<{
      id: string;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }>
  >([]);
  const selectionRafRef = useRef<number | null>(null);
  const rubberBandAdditiveRef = useRef(false);

  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch,
  } = useDocuments({
    folder_id: currentFolderId,
    search: searchQuery || undefined,
    page: page + 1,
    limit: rowsPerPage,
    sort_by: sortField,
    order: sortOrder,
  });

  const { user, isExpert } = usePermissions();

  const mailAttachmentsParams: MailAttachmentsListParams | undefined = isExpert
    ? undefined
    : {
        mail_attachment_type: emailAttachmentType,
        search: searchQuery || undefined,
        sort_by: emailSortField,
        order: emailSortOrder,
        page: emailPage + 1,
        page_size: emailRowsPerPage,
      };

  const {
    data: mailAttachmentsResponse,
    isLoading: isMailLoading,
  } = useMailAttachments(mailAttachmentsParams);

  const { data: caseSuggestions } = useCaseSuggestions(caseSearchQuery);

  useEffect(() => {
    const folderIdFromQuery = searchParams.get("folderId");
    if (!folderIdFromQuery) return;

    const folderNameFromQuery = searchParams.get("folderName") || "Папка";
    const folderPathFromQuery = searchParams.get("folderPath");

    let resolvedPath: Array<{ id: string | null; name: string }> = [
      { id: null, name: "Корень" },
      { id: folderIdFromQuery, name: folderNameFromQuery },
    ];

    if (folderPathFromQuery) {
      try {
        const parsedPath = JSON.parse(
          decodeURIComponent(folderPathFromQuery),
        ) as Array<{ id: string; name: string }>;
        if (Array.isArray(parsedPath) && parsedPath.length > 0) {
          resolvedPath = [{ id: null, name: "Корень" }, ...parsedPath];
        }
      } catch {
        // ignore invalid folderPath query
      }
    }

    setCurrentFolderId(folderIdFromQuery);
    setFolderPath(resolvedPath);
    setPage(0);
  }, [searchParams]);

  const entriesArray = documentsResponse?.items ?? [];
  const paginationMeta = documentsResponse?.meta;
  const total = paginationMeta?.total_items ?? entriesArray.length;

  // Мутации
  const createFolder = useCreateFolder();
  const uploadDocument = useUploadDocument();
  const downloadDocument = useDownloadDocument();
  const previewDocument = usePreviewDocument();
  const downloadFolder = useDownloadFolder();
  const updateAsset = useUpdateAsset();
  const downloadBulkAssets = useDownloadBulkAssets();
  const trashAssets = useTrashAssets();

  const canShare = user?.role !== "expert";
  const createUserShare = useCreateUserShare();
  const createLinkShare = useCreateLinkShare();
  const revokeShare = useRevokeShare();
  const shareResourceQuery = useShareResource(
    shareEntry
      ? shareEntry.type === "folder"
        ? { folder_id: shareEntry.id }
        : { document_id: shareEntry.id }
      : {},
    Boolean(shareEntry),
  );

  const getShareBatchId = (batch: { id?: string | null; batch_id?: string | null }) =>
    (typeof batch.batch_id === "string" && batch.batch_id) ||
    (typeof batch.id === "string" && batch.id) ||
    "";

  const getShareLinkUrl = (link: { link_url?: string | null; url?: string | null; share_token?: string | null }) => {
    if (link.link_url) return link.link_url;
    if (link.url) return link.url;
    if (link.share_token) return `${window.location.origin}/share/${link.share_token}`;
    return "";
  };

  const getCompactShareLink = (url: string) => {
    if (!url) return "";
    if (url.length <= 60) return url;
    return `${url.slice(0, 35)}...${url.slice(-15)}`;
  };

  const sanitizedEntries = useMemo(
    () =>
      entriesArray.filter((entry) => entry.id && !entry.id.startsWith("__")),
    [entriesArray],
  );

  const selectedEntries = useMemo(
    () =>
      sanitizedEntries.filter((entry) => selectedEntryIds.includes(entry.id)),
    [sanitizedEntries, selectedEntryIds],
  );

  const selectedEntryIdsSet = useMemo(
    () => new Set(selectedEntryIds),
    [selectedEntryIds],
  );

  const selectedFoldersCount = useMemo(
    () => selectedEntries.filter((entry) => entry.type === "folder").length,
    [selectedEntries],
  );
  const selectedFilesCount = selectedEntries.length - selectedFoldersCount;
  const isSelectionMode = selectedEntryIds.length > 0;

  const isCaseBoundFolder = (entry: FileSystemEntry) =>
    entry.type === "folder" && Boolean(entry.case_id);


  const isOwnedResource = (entry: FileSystemEntry) => {
    if (!user?.id || !entry.created_by_id) return true;
    return entry.created_by_id === user.id;
  };

  const hasShareInfo = (entry: FileSystemEntry) =>
    (entry.share_info?.recipient_count ?? 0) > 0 ||
    (entry.share_info?.public_link_count ?? 0) > 0;

  const isSharedWithCurrentUser = (entry: FileSystemEntry) =>
    user?.role === "expert" && !isOwnedResource(entry);

  const clearSelection = useCallback(() => {
    setSelectedEntryIds([]);
    setSelectionAnchorId(null);
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      if (!recipientQuery.trim()) {
        setRecipientOptions([]);
        return;
      }
      try {
        const response = await usersApi.getUsers({ search: recipientQuery, limit: 10 });
        const payload = response.data;
        setRecipientOptions(Array.isArray(payload) ? payload : payload.items);
      } catch {
        setRecipientOptions([]);
      }
    };

    const id = window.setTimeout(loadUsers, 250);
    return () => window.clearTimeout(id);
  }, [recipientQuery]);

  const openShareDialog = (entry: FileSystemEntry, tabIndex = 0) => {
    setShareEntry(entry);
    setShareTab(tabIndex);
    setShareDialogOpen(true);
  };

  const handleSubmitUserShare = async () => {
    if (!shareEntry || selectedRecipients.length === 0) return;

    const resource =
      shareEntry.type === "folder"
        ? { folder_id: shareEntry.id, permission_level: permissionLevel, can_download: canDownloadShare }
        : { document_id: shareEntry.id, permission_level: permissionLevel, can_download: canDownloadShare };

    try {
      await createUserShare.mutateAsync({
        shared_with_user_ids: selectedRecipients.map((recipient) => recipient.id),
        resources: [resource],
        expires_at: expiresAt ? dayjs(expiresAt).toISOString() : null,
        message: shareMessage || null,
      });
      notificationService.success(`Доступ передан ${selectedRecipients.length} сотрудникам`);
      setShareDialogOpen(false);
      setSelectedRecipients([]);
      shareResourceQuery.refetch();
    } catch {
      // handled by interceptor
    }
  };

  const handleCreatePublicLink = async () => {
    if (!shareEntry) return;

    const resource =
      shareEntry.type === "folder"
        ? { folder_id: shareEntry.id, can_download: canDownloadShare }
        : { document_id: shareEntry.id, can_download: canDownloadShare };

    try {
      const created = await createLinkShare.mutateAsync({
        resources: [resource],
        expires_at: expiresAt ? dayjs(expiresAt).toISOString() : null,
        message: shareMessage || null,
      });
      setPublicLink(getShareLinkUrl(created) || null);
      shareResourceQuery.refetch();
    } catch {
      // noop
    }
  };

  const buildRangeSelection = useCallback(
    (targetId: string) => {
      if (!selectionAnchorId) {
        return [targetId];
      }
      const anchorIndex = sanitizedEntries.findIndex(
        (entry) => entry.id === selectionAnchorId,
      );
      const targetIndex = sanitizedEntries.findIndex(
        (entry) => entry.id === targetId,
      );
      if (anchorIndex === -1 || targetIndex === -1) {
        return [targetId];
      }
      const [start, end] =
        anchorIndex < targetIndex
          ? [anchorIndex, targetIndex]
          : [targetIndex, anchorIndex];
      return sanitizedEntries.slice(start, end + 1).map((entry) => entry.id);
    },
    [sanitizedEntries, selectionAnchorId],
  );

  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId],
    );
  }, []);

  const handleBulkDownload = async () => {
    if (!selectedEntries.length) return;
    try {
      setDownloadingLabel("Массовое скачивание (ZIP)");
      setDownloadProgress(0);

      await downloadBulkAssets.mutateAsync({
        folder_ids: selectedEntries
          .filter((entry) => entry.type === "folder")
          .map((entry) => entry.id),
        document_ids: selectedEntries
          .filter((entry) => entry.type === "file")
          .map((entry) => entry.id),
        onDownloadProgress: (progress) => setDownloadProgress(progress),
      });
      notificationService.success(
        `Подготовлено к скачиванию: ${selectedEntries.length}`,
      );
    } catch (error) {
      console.error("Ошибка массового скачивания:", error);
      notificationService.error("Не удалось скачать выбранные элементы");
    } finally {
      setTimeout(() => {
        setDownloadProgress(0);
        setDownloadingLabel("");
      }, 500);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedEntries.length) return;

    try {
      await trashAssets.mutateAsync({
        folder_ids: selectedEntries
          .filter((entry) => entry.type === "folder")
          .map((entry) => entry.id),
        document_ids: selectedEntries
          .filter((entry) => entry.type === "file")
          .map((entry) => entry.id),
      });
      notificationService.success(
        `Элементы перемещены в корзину: ${selectedEntries.length}`,
      );
      clearSelection();
      refetch();
    } catch (error) {
      console.error("Ошибка массового перемещения в корзину:", error);
      notificationService.error("Не удалось переместить выбранные элементы в корзину");
    }
  };

  // Отладка: проверка валидности записей
  useEffect(() => {
    if (entriesArray.length > 0) {
      const invalid = entriesArray.filter((e) => !e.id || !e.name || !e.type);
      if (invalid.length > 0) {
        console.warn("Найдены некорректные записи:", invalid);
      }
    }
  }, [entriesArray]);

  useEffect(() => {
    clearSelection();
  }, [currentFolderId, searchQuery, page, rowsPerPage, clearSelection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setSelectedEntryIds(sanitizedEntries.map((entry) => entry.id));
        if (sanitizedEntries[0]) {
          setSelectionAnchorId(sanitizedEntries[0].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sanitizedEntries]);

  useEffect(() => {
    if (!isRubberBandSelecting) return;

    const handleMouseMove = (event: MouseEvent) => {
      const tableNode = tableAreaRef.current;
      const start = selectionStartRef.current;
      if (!tableNode || !start) return;
      const rect = tableNode.getBoundingClientRect();

      const currentX = Math.min(Math.max(event.clientX, rect.left), rect.right);
      const currentY = Math.min(Math.max(event.clientY, rect.top), rect.bottom);
      const left = Math.min(start.x, currentX) - rect.left;
      const top = Math.min(start.y, currentY) - rect.top;
      const width = Math.abs(currentX - start.x);
      const height = Math.abs(currentY - start.y);
      setSelectionBox({ left, top, width, height });

      const idsInFrame = selectionFrameEntriesRef.current
        .filter((entry) => {
          const rowRect = entry;
          return !(
            rowRect.right < Math.min(start.x, currentX) ||
            rowRect.left > Math.max(start.x, currentX) ||
            rowRect.bottom < Math.min(start.y, currentY) ||
            rowRect.top > Math.max(start.y, currentY)
          );
        })
        .map((entry) => entry.id);

      setSelectedEntryIds((prev) => {
        const next = rubberBandAdditiveRef.current
          ? Array.from(new Set([...prev, ...idsInFrame]))
          : idsInFrame;

        if (
          next.length === prev.length &&
          next.every((id, index) => id === prev[index])
        ) {
          return prev;
        }

        return next;
      });
    };

    const handleMouseUp = () => {
      setIsRubberBandSelecting(false);
      setSelectionBox(null);
      selectionStartRef.current = null;
      selectionFrameEntriesRef.current = [];
      rubberBandAdditiveRef.current = false;
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
        selectionRafRef.current = null;
      }
    };

    const handleMouseMoveThrottled = (event: MouseEvent) => {
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
      }
      selectionRafRef.current = requestAnimationFrame(() => {
        handleMouseMove(event);
        selectionRafRef.current = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMoveThrottled);
    window.addEventListener("mouseup", handleMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveThrottled);
      window.removeEventListener("mouseup", handleMouseUp);
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
        selectionRafRef.current = null;
      }
    };
  }, [isRubberBandSelecting]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Получение иконки для файла
  const getFileIcon = (entry: FileSystemEntry) => {
    if (entry.type === "folder") {
      return <FolderOutlined color="primary" />;
    }
    const ext = entry.extension?.replace(".", "").toLowerCase() || "";
    return fileIcons[ext] || <DescriptionOutlined color="action" />;
  };

  // Обработчики навигации
  const handleFolderClick = (folder: FileSystemEntry) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setPage(0);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
    setPage(0);
  };

  // Обработчики пагинации
  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  const handleChangeRowsPerPage = (nextLimit: number) => {
    setRowsPerPage(nextLimit);
    setPage(0);
  };

  // Обработчики сортировки
  const handleSortChange = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  // Создание папки
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        parent_id: currentFolderId,
      });
      setCreateFolderOpen(false);
      setNewFolderName("");
      setPage(0);
      notificationService.success("Папка успешно создана");
      refetch();
    } catch (error) {
      console.error("Ошибка создания папки:", error);
    }
  };

  // Обработчики загрузки файлов
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const filteredFiles = files.filter((file) => !isSystemOrTempFile(file));
      setSelectedFiles(filteredFiles);
      setUploadDialogOpen(true);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const filteredFiles = files.filter((file) => !isSystemOrTempFile(file));
      setSelectedFiles(filteredFiles);
      setUploadDialogOpen(true);
    }
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
      const files = fileGroups.flat();
      const filteredFiles = files.filter((file) => !isSystemOrTempFile(file));

      if (filteredFiles.length === 0) {
        notificationService.warning("Нет подходящих файлов для загрузки");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...filteredFiles]);
      setUploadDialogOpen(true);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
      notificationService.error("Не удалось выбрать папки");
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const files = selectedFiles.filter((file) => !isSystemOrTempFile(file));
    if (files.length === 0) {
      notificationService.warning("Нет подходящих файлов для загрузки");
      return;
    }

    const totalFiles = files.length;
    const maxConcurrency = Math.min(4, totalFiles);
    const progressByFile = new Map<number, number>();
    files.forEach((_, index) => progressByFile.set(index, 0));

    const updateOverallProgress = () => {
      const total = Array.from(progressByFile.values()).reduce(
        (sum, value) => sum + value,
        0,
      );
      setUploadProgress(Math.round(total / totalFiles));
    };

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const folderPaths = new Set<string>();
      files.forEach((file) => {
        if (!file.webkitRelativePath) return;
        const pathParts = file.webkitRelativePath.split("/").slice(0, -1);
        for (let i = 1; i <= pathParts.length; i += 1) {
          folderPaths.add(pathParts.slice(0, i).join("/"));
        }
      });

      const folderIdByPath = new Map<string, string>();
      const sortedFolders = Array.from(folderPaths).sort(
        (a, b) => a.split("/").length - b.split("/").length,
      );

      for (const folderPath of sortedFolders) {
        const pathParts = folderPath.split("/");
        const folderName = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join("/");
        const parentId = parentPath
          ? (folderIdByPath.get(parentPath) ?? null)
          : currentFolderId;

        const createdFolder = await createFolder.mutateAsync({
          name: folderName,
          parent_id: parentId,
          case_id: parentId ? null : selectedCase?.id || null,
        });

        folderIdByPath.set(folderPath, createdFolder.id);
      }

      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < totalFiles) {
          const fileIndex = nextIndex;
          nextIndex += 1;
          const file = files[fileIndex];

          setUploadingFileName(file.name);

          const relativePath = file.webkitRelativePath || file.name;
          const folderPath = relativePath.split("/").slice(0, -1).join("/");
          const folderId = folderPath
            ? (folderIdByPath.get(folderPath) ?? null)
            : currentFolderId;

          await uploadDocument.mutateAsync({
            file,
            folder_id: folderId,
            case_id: folderId ? null : selectedCase?.id || null,
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

      await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));

      setUploadProgress(100);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadCaseId("");
      setUploadTitle("");
      setSelectedCase(null);
      setCaseSearchQuery("");
      notificationService.success(`Успешно загружено файлов: ${files.length}`);
      refetch();
    } catch (error) {
      console.error("Ошибка загрузки файлов:", error);
      notificationService.error(
        "Ошибка загрузки файлов. Проверьте логи для подробностей.",
      );
    } finally {
      setIsUploading(false);
      setUploadingFileName("");
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleDownload = (documentId: string) => {
    setDownloadingLabel("Скачивание файла");
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
            setDownloadingLabel("");
          }, 500);
        },
      },
    );
  };

  const handleDownloadFolder = (folderId: string) => {
    setDownloadingLabel("Скачивание папки (ZIP)");
    setDownloadProgress(0);

    downloadFolder.mutate(
      {
        folderId,
        onDownloadProgress: (progress) => setDownloadProgress(progress),
      },
      {
        onSettled: () => {
          setTimeout(() => {
            setDownloadProgress(0);
            setDownloadingLabel("");
          }, 500);
        },
      },
    );
  };

  const handlePreview = (documentId: string) => {
    previewDocument.mutate(documentId);
  };

  const handleFileDoubleClick = (entry: FileSystemEntry) => {
    if (entry.type === "file") {
      handlePreview(entry.id);
      return;
    }
    handleFolderClick(entry);
  };

  // Обработчики контекстного меню
  // Открытие меню
  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    entry: FileSystemEntry,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuEntry(entry);
  };

  // Закрытие меню — сбрасывает ТОЛЬКО menuEntry и menuAnchor
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuEntry(null);
  };

  // Обработчики действий из меню
  // Предпросмотр
  const handleMenuPreview = () => {
    if (menuEntry) {
      handlePreview(menuEntry.id);
    }
    handleMenuClose();
  };

  // Скачать файл
  const handleMenuDownload = () => {
    if (selectedEntryIds.length > 1) {
      void handleBulkDownload();
    } else if (menuEntry) {
      handleDownload(menuEntry.id);
    }
    handleMenuClose();
  };

  // Скачать папку
  const handleMenuDownloadFolder = () => {
    if (menuEntry) {
      handleDownloadFolder(menuEntry.id);
    }
    handleMenuClose();
  };

  // Редактировать — копируем entry в отдельное состояние ДО закрытия меню
  const handleMenuEdit = () => {
    if (menuEntry) {
      setEntryToEdit(menuEntry);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  // Удалить — копируем entry в отдельное состояние ДО закрытия меню
  const handleMenuDelete = () => {
    if (selectedEntryIds.length > 1) {
      setEntryToDelete(null);
      setDeleteConfirmOpen(true);
      handleMenuClose();
      return;
    }
    if (!menuEntry) {
      handleMenuClose();
      return;
    }

    // Валидация
    if (
      !menuEntry.id ||
      typeof menuEntry.id !== "string" ||
      menuEntry.id.startsWith("__")
    ) {
      console.warn("Попытка удалить недопустимый элемент:", menuEntry);
      notificationService.warning("Этот элемент нельзя удалить");
      handleMenuClose();
      return;
    }

    if (!menuEntry.name || !menuEntry.type) {
      console.error("Элемент не содержит name или type:", menuEntry);
      notificationService.error("Невозможно удалить: данные повреждены.");
      handleMenuClose();
      return;
    }

    // Сохраняем элемент для удаления ПЕРЕД закрытием меню
    setEntryToDelete(menuEntry);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleEntryContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    entry: FileSystemEntry,
  ) => {
    event.preventDefault();
    if (!selectedEntryIds.includes(entry.id)) {
      setSelectedEntryIds([entry.id]);
      setSelectionAnchorId(entry.id);
    }
    setMenuAnchor(event.currentTarget);
    setMenuEntry(entry);
  };

  const handleDelete = async () => {
    if (selectedEntryIds.length > 0 && !entryToDelete) {
      await handleBulkDelete();
      setDeleteConfirmOpen(false);
      return;
    }

    if (!entryToDelete?.id || !entryToDelete.type) {
      console.error("handleDelete: некорректный элемент", entryToDelete);
      notificationService.error("Не удалось определить элемент для перемещения в корзину");
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      return;
    }

    try {
      console.log("Перемещение элемента в корзину:", {
        id: entryToDelete.id,
        type: entryToDelete.type,
        name: entryToDelete.name,
      });

      await trashAssets.mutateAsync({
        folder_ids:
          entryToDelete.type === "folder" ? [entryToDelete.id] : [],
        document_ids:
          entryToDelete.type === "file" ? [entryToDelete.id] : [],
      });

      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      notificationService.success("Элемент успешно перемещён в корзину");

      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error("Ошибка перемещения в корзину:", error);
      notificationService.error("Не удалось переместить элемент в корзину. Подробности в консоли.");
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSaveEdit = async (data: any) => {
    if (!entryToEdit) return;
    try {

      const updateData = {
        asset_id: entryToEdit.id,
        asset_type: entryToEdit.type,
        data: {
          ...data,
          ...(entryToEdit.type === "folder" && data.name
            ? { name: data.name }
            : {}),
          ...(entryToEdit.type === "file" && data.title
            ? { title: data.title }
            : {}),
        },
      };
      await updateAsset.mutateAsync(updateData);
      setEditDialogOpen(false);
      setEntryToEdit(null);
      notificationService.success("Изменения успешно сохранены");
      refetch();
    } catch (error) {
      console.error("Ошибка обновления:", error);
    }
  };

  // Обработчики перемещения файлов и папок
  const handleAssetDrop = async (
    assetId: string,
    assetType: "file" | "folder",
    targetFolderId: string | null,
    assetName?: string,
  ) => {
    try {
      const draggedEntry = entriesArray.find((entry) => entry.id === assetId);

      const fallbackName = assetName || draggedEntry?.name;
      const updateData = {
        asset_id: assetId,
        asset_type: assetType,
        data:
          assetType === "folder"
            ? {
                parent_id: targetFolderId === null ? null : targetFolderId,
                ...(fallbackName ? { name: fallbackName } : {}),
              }
            : {
                folder_id: targetFolderId === null ? null : targetFolderId,
                ...(fallbackName ? { title: fallbackName } : {}),
              },
      };
      await updateAsset.mutateAsync(updateData);
      notificationService.success("Элемент успешно перемещён");
      refetch();
    } catch (error) {
      console.error("Ошибка перемещения:", error);
    }
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

  // Обработчики для пути навигации
  const handlePathDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const hasInternalData = e.dataTransfer.types.includes("application/json");
    if (hasInternalData || Boolean(draggedItemId)) {
      setDragOverFolderPathIndex(index);
    }
  };

  const handlePathDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPathIndex(null);
  };

  const handlePathDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId) {
      setDragOverFolderPathIndex(index);
    }
    e.dataTransfer.dropEffect = "move";
  };

  const handlePathDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPathIndex(null);
    const assetData = e.dataTransfer.getData("application/json");
    if (assetData) {
      try {
        const { id, type, name } = JSON.parse(assetData);
        const targetFolderId = folderPath[index].id;
        handleAssetDrop(id, type as "file" | "folder", targetFolderId, name);
      } catch (error) {
        console.error("Ошибка парсинга данных перетаскивания:", error);
      }
    }
  };

  // Обработчики для строки таблицы
  const handleRowDragStart = (e: React.DragEvent, entry: FileSystemEntry) => {
    if (entry.id === "__parent_folder__") return;
    setDraggedItemId(entry.id);
    setIsDraggingInternal(true);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: entry.id,
        type: entry.type,
        name: entry.name,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
    const dragImage = document.createElement("div");
    dragImage.innerHTML = `
      <div style="
        background: white;
        border: 2px solid #1976d2;
        border-radius: 8px;
        padding: 8px 16px;
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 200px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        font-size: 14px;
        font-weight: 500;
      ">
        ${entry.type === "folder" ? "<span>📁</span>" : "<span>📄</span>"}
        <span>${entry.name}</span>
      </div>
    `;
    dragImage.style.position = "absolute";
    dragImage.style.top = "-9999px";
    dragImage.style.left = "-9999px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleRowDragEnd = () => {
    setDraggedItemId(null);
    setIsDraggingInternal(false);
    setDragOverItemId(null);
  };

  const handleRowDragEnter = (e: React.DragEvent, entry: FileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.id === draggedItemId) return;
    if (entry.type === "folder") {
      const hasInternalData = e.dataTransfer.types.includes("application/json");
      if (hasInternalData) {
        setDragOverItemId(entry.id);
      }
    }
  };

  const handleRowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget;
    if (
      relatedTarget === null ||
      !(relatedTarget instanceof Node) ||
      !e.currentTarget.contains(relatedTarget)
    ) {
      setDragOverItemId(null);
    }
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleRowDrop = (e: React.DragEvent, entry: FileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
    if (draggedItemId === entry.id) return;
    const assetData = e.dataTransfer.getData("application/json");
    if (assetData && entry.type === "folder") {
      try {
        const { id, type, name } = JSON.parse(assetData);
        handleAssetDrop(id, type as "file" | "folder", entry.id, name);
      } catch (error) {
        console.error("Ошибка парсинга данных перетаскивания:", error);
      }
    }
  };

  // Пустое состояние
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {activeMode === "email" ? (
            <Mail sx={{ fontSize: 60, color: "action.disabled" }} />
          ) : (
            <FolderOutlined sx={{ fontSize: 60, color: "action.disabled" }} />
          )}
          <Typography variant="h6">
            {activeMode === "email" ? "В почте пока нет документов" : "Папка пуста"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? "По вашему запросу ничего не найдено"
              : activeMode === "email"
                ? "Вложения из писем появятся здесь"
                : "Создайте папку или загрузите файлы"}
          </Typography>
          {!searchQuery && activeMode === "storage" && (
            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CreateNewFolder />}
                onClick={() => setCreateFolderOpen(true)}
                sx={actionButtonSx}
              >
                Создать папку
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadDialogOpen(true);
                }}
                sx={actionButtonSx}
              >
                Загрузить файлы
              </Button>
            </Box>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

  // Обработка ошибки
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки документов. Пожалуйста, попробуйте обновить страницу.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Заголовок и действия */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        flexDirection={{ xs: "column", md: "row" }}
        gap={1.5}
        mb={2}
      >
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: 32, md: 38 }, fontWeight: 800 }}
        >
          Документы
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {activeMode === "storage" && (
            <Button
              variant="outlined"
              startIcon={<CreateNewFolder />}
              onClick={() => setCreateFolderOpen(true)}
              sx={actionButtonSx}
            >
              Создать папку
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => {
              setSelectedFiles([]);
              setUploadDialogOpen(true);
            }}
            sx={actionButtonSx}
            disabled={activeMode === "email"}
          >
            Загрузить файлы
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteSweep />}
            onClick={() => navigate("/crm/documents/trash")}
            sx={actionButtonSx}
          >
            Открыть корзину
          </Button>
        </Box>
      </Box>

      {isSelectionMode && (
        <Paper
          sx={{
            mb: 2,
            borderRadius: 3,
            p: 1.25,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" fontWeight={700}>
              Выбрано: {selectedEntryIds.length} (папок: {selectedFoldersCount},
              файлов: {selectedFilesCount})
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download />}
                onClick={() => void handleBulkDownload()}
                disabled={downloadBulkAssets.isPending}
              >
                Скачать выбранное
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteSweep />}
                onClick={() => {
                  setEntryToDelete(null);
                  setDeleteConfirmOpen(true);
                }}
                disabled={trashAssets.isPending}
              >
                В корзину выбранное
              </Button>
              <Button size="small" onClick={clearSelection}>
                Снять выделение
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Навигация и поиск */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        {/* Mode Switcher */}
        <Box mb={2}>
          <DocumentModeSwitcher
            activeMode={activeMode}
            onModeChange={setActiveMode}
          />
        </Box>

        {/* Folder navigation - only in storage mode */}
        {activeMode === "storage" && (
          <Box mb={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Текущая папка (можно перетащить элемент в любой сегмент пути)
            </Typography>
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              sx={{
                p: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "background.paper",
                alignItems: "center",
              }}
            >
              {folderPath.map((folder, index) => {
                const isDragOver = dragOverFolderPathIndex === index;
                const isCurrent = index === folderPath.length - 1;
                return (
                  <Button
                    key={index}
                    variant={isCurrent ? "contained" : "text"}
                    color={isCurrent ? "primary" : "inherit"}
                    onDragEnter={(e) => handlePathDragEnter(e, index)}
                    onDragLeave={handlePathDragLeave}
                    onDragOver={(e) => handlePathDragOver(e, index)}
                    onDrop={(e) => handlePathDrop(e, index)}
                    onClick={() => handleBreadcrumbClick(index)}
                    startIcon={
                      index === 0 ? (
                        <Home fontSize="small" />
                      ) : (
                        <FolderOutlined fontSize="small" />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      minHeight: 38,
                      borderRadius: 1,
                      px: 1.25,
                      border: isDragOver
                        ? (theme) => `2px solid ${theme.palette.primary.main}`
                        : undefined,
                      bgcolor: isDragOver
                        ? (theme) => alpha(theme.palette.primary.main, 0.2)
                        : undefined,
                      boxShadow: isDragOver
                        ? (theme) =>
                            `0 0 0 2px ${alpha(theme.palette.primary.main, 0.18)}`
                        : "none",
                      maxWidth: 220,
                      "& .MuiButton-startIcon": {
                        mr: 0.5,
                        color: isDragOver ? "primary.main" : "inherit",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sanitizeAndRender(folder.name)}
                    </Box>
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Search */}
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder={activeMode === "storage" ? "Поиск файлов и папок" : "Поиск вложений"}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
              setEmailPage(0);
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "text.primary" }} />,
            }}
            sx={{
              width: { xs: "100%", md: 340 },
              "& input::placeholder": {
                color: "text.primary",
                opacity: 0.75,
              },
            }}
          />
          {activeMode === "storage" && (
            <ToggleButtonGroup
              value={scope}
              exclusive
              onChange={(_, newScope) => {
                if (newScope) {
                  setScope(newScope);
                  setPage(0);
                }
              }}
              size="small"
              aria-label="scope filter"
            >
              <ToggleButton
                value="my"
                aria-label="my documents"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                }}
              >
                <Person sx={{ mr: 0.5, fontSize: 18 }} />
                Мои
              </ToggleButton>
              <ToggleButton
                value="all"
                aria-label="all documents"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                }}
              >
                <Group sx={{ mr: 0.5, fontSize: 18 }} />
                Все
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {searchQuery && (
            <Typography variant="body2" color="text.secondary">
              {activeMode === "storage" ? "Поиск в текущей папке" : "Поиск в почте"}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Email Mode View */}
      {activeMode === "email" && (
        <EmailDocumentsView
          attachments={mailAttachmentsResponse?.items ?? []}
          isLoading={isMailLoading}
          paginationMeta={mailAttachmentsResponse?.meta}
          page={emailPage}
          rowsPerPage={emailRowsPerPage}
          sortField={emailSortField}
          sortOrder={emailSortOrder}
          onSortChange={(field) => {
            const isAsc = emailSortField === field && emailSortOrder === "asc";
            setEmailSortOrder(isAsc ? "desc" : "asc");
            setEmailSortField(field);
          }}
          onPageChange={setEmailPage}
          onRowsPerPageChange={setEmailRowsPerPage}
          searchQuery={searchQuery}
          attachmentType={emailAttachmentType}
          onAttachmentTypeChange={setEmailAttachmentType}
          onOpenMessage={(messageId) => {
            navigate(`/crm/mail/inbox/${messageId}`);
          }}
        />
      )}

      {/* Storage Mode View - drag-and-drop area */}
      {activeMode === "storage" && (
      <Box
        ref={tableAreaRef}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          const hasEntryTarget = Boolean(target.closest("[data-entry-id]"));
          if (e.button !== 0 || hasEntryTarget) return;

          if (!e.ctrlKey && !e.metaKey) {
            clearSelection();
          }

          selectionStartRef.current = { x: e.clientX, y: e.clientY };
          selectionFrameEntriesRef.current = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>("[data-entry-id]"),
          )
            .map((node) => {
              const rect = node.getBoundingClientRect();
              return {
                id: node.dataset.entryId ?? "",
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
              };
            })
            .filter((item) => Boolean(item.id));
          rubberBandAdditiveRef.current = Boolean(e.ctrlKey || e.metaKey);
          setIsRubberBandSelecting(true);
          setSelectionBox({
            left: e.nativeEvent.offsetX,
            top: e.nativeEvent.offsetY,
            width: 0,
            height: 0,
          });
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest("[data-entry-id]")) {
            clearSelection();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.items && !isDraggingInternal) {
            const hasFiles = Array.from(e.dataTransfer.items).some(
              (item) => item.kind === "file",
            );
            if (hasFiles && !uploadDialogOpen) setDragOverTable(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX <= rect.left + 10 ||
            e.clientX >= rect.right - 10 ||
            e.clientY <= rect.top + 10 ||
            e.clientY >= rect.bottom - 10
          ) {
            setDragOverTable(false);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverTable(false);
          if (
            e.dataTransfer.files &&
            e.dataTransfer.files.length > 0 &&
            !isDraggingInternal
          ) {
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles(files);
            setDragOverUploadDialog(false);
            setUploadDialogOpen(true);
          }
        }}
        sx={{
          position: "relative",
          border: "2px dashed",
          borderColor: dragOverTable ? "primary.main" : "transparent",
          borderRadius: 2,
          transition: "border-color 0.2s ease",
          "&:hover": {
            borderColor: dragOverTable ? "#1976d2" : "divider",
          },
        }}
      >
        {selectionBox && (
          <Box
            sx={{
              position: "absolute",
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
              border: (theme) => `1px solid ${theme.palette.primary.main}`,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
              pointerEvents: "none",
              zIndex: 8,
            }}
          />
        )}
        <Paper
          sx={{ borderRadius: 2, overflow: "hidden", position: "relative" }}
        >
          {(downloadFolder.isPending ||
            downloadDocument.isPending ||
            downloadBulkAssets.isPending) && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {downloadingLabel || "Скачивание"}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {downloadProgress}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={downloadProgress} />
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ width: 52, py: 1 }} />
                  <TableCell sx={{ width: 84, py: 1 }}>Превью</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "name"}
                      direction={sortField === "name" ? sortOrder : "asc"}
                      onClick={() => handleSortChange("name")}
                    >
                      Имя
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 130 }}>Передан</TableCell>
                  <TableCell sx={{ width: 110 }}>
                    <TableSortLabel
                      active={sortField === "size"}
                      direction={sortField === "size" ? sortOrder : "asc"}
                      onClick={() => handleSortChange("size")}
                    >
                      Размер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 160 }}>
                    <TableSortLabel
                      active={sortField === "created_at"}
                      direction={sortField === "created_at" ? sortOrder : "asc"}
                      onClick={() => handleSortChange("created_at")}
                    >
                      Дата создания
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 170 }}>
                    <TableSortLabel
                      active={sortField === "created_by"}
                      direction={sortField === "created_by" ? sortOrder : "asc"}
                      onClick={() => handleSortChange("created_by")}
                    >
                      Кто создал
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 72, pr: 1.5 }} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: rowsPerPage }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton variant="circular" width={20} height={20} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="circular" width={24} height={24} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="30%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="45%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="50%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="70%" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  : entriesArray.length === 0
                    ? renderEmptyState()
                    : entriesArray.map((entry, index) => {
                        // Пропускаем искусственные записи
                        if (entry.id?.startsWith("__")) return null;
                        const isDragging = draggedItemId === entry.id;
                        const isDragOver = dragOverItemId === entry.id;
                        const isSelected = selectedEntryIdsSet.has(entry.id);
                        const showCheckbox =
                          isSelectionMode || hoveredEntryId === entry.id;
                        return (
                          <TableRow
                            key={entry.id}
                            hover
                            draggable
                            data-entry-id={entry.id}
                            onDragStart={(e) => handleRowDragStart(e, entry)}
                            onDragEnd={handleRowDragEnd}
                            onDragEnter={(e) => handleRowDragEnter(e, entry)}
                            onDragLeave={handleRowDragLeave}
                            onDragOver={handleRowDragOver}
                            onDrop={(e) => handleRowDrop(e, entry)}
                            onMouseEnter={() => setHoveredEntryId(entry.id)}
                            onMouseLeave={() =>
                              setHoveredEntryId((prev) =>
                                prev === entry.id ? null : prev,
                              )
                            }
                            onContextMenu={(e) =>
                              handleEntryContextMenu(e, entry)
                            }
                            sx={{
                              cursor:
                                entry.type === "folder" ? "pointer" : "default",
                              opacity: isDragging ? 0.65 : 1,
                              backgroundColor: isDragOver
                                ? (theme) =>
                                    alpha(theme.palette.primary.main, 0.08)
                                : isSelected
                                  ? (theme) =>
                                      alpha(theme.palette.primary.main, 0.14)
                                  : (theme) =>
                                      index % 2
                                        ? alpha(
                                            theme.palette.common.black,
                                            0.02,
                                          )
                                        : "transparent",
                              borderLeft: isDragOver
                                ? (theme) =>
                                    `3px solid ${theme.palette.primary.main}`
                                : isSelected
                                  ? (theme) =>
                                      `3px solid ${theme.palette.primary.main}`
                                  : "3px solid transparent",
                              transition:
                                "background-color 0.15s ease, border-color 0.15s ease",
                              "&:hover": {
                                bgcolor: "action.hover",
                              },
                              "& > td": {
                                py: 1,
                                borderBottom: "none",
                                lineHeight: 1.6,
                              },
                            }}
                            onDoubleClick={() => handleFileDoubleClick(entry)}
                          >
                            <TableCell>
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                sx={{
                                  opacity: showCheckbox ? 1 : 0,
                                  transition: "opacity 0.2s ease",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (e.shiftKey) {
                                    const range = buildRangeSelection(entry.id);
                                    setSelectedEntryIds((prev) =>
                                      e.ctrlKey || e.metaKey
                                        ? Array.from(
                                            new Set([...prev, ...range]),
                                          )
                                        : range,
                                    );
                                    return;
                                  }

                                  if (e.ctrlKey || e.metaKey) {
                                    toggleEntrySelection(entry.id);
                                    setSelectionAnchorId(entry.id);
                                    return;
                                  }

                                  toggleEntrySelection(entry.id);
                                  setSelectionAnchorId(entry.id);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip
                                title={
                                  entry.type === "folder"
                                    ? "Перетащите сюда файл или папку"
                                    : "Файл"
                                }
                              >
                                <Box
                                  sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 2.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: "rgba(255,255,255,0.78)",
                                    border: "1px solid rgba(255,255,255,0.95)",
                                    boxShadow:
                                      "0 8px 18px rgba(48,69,103,0.08)",
                                    color: isDragOver
                                      ? "primary.main"
                                      : "inherit",
                                  }}
                                >
                                  {getFileIcon(entry)}
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flexWrap="wrap"
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={
                                    entry.type === "folder" ? 600 : 500
                                  }
                                  sx={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: { xs: 160, sm: 280, md: "none" },
                                    color:
                                      isDragOver && entry.type === "folder"
                                        ? "primary.main"
                                        : "inherit",
                                  }}
                                >
                                  {sanitizeAndRender(entry.name)}
                                </Typography>
                                {entry.type === "file" && entry.extension && (
                                  <Chip
                                    label={entry.extension
                                      .replace(".", "")
                                      .toUpperCase()}
                                    size="small"
                                    variant="outlined"
                                    color="default"
                                    sx={{
                                      fontSize: "0.68rem",
                                      height: 18,
                                      bgcolor: "rgba(79,144,255,0.1)",
                                      border: "none",
                                    }}
                                  />
                                )}
                                {isCaseBoundFolder(entry) && (
                                  <>
                                    <Chip
                                      label={`Привязано к делу${entry.case_number ? `: ${entry.case_number}` : ""}`}
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                    />
                                    {entry.case_id && (
                                      <Button
                                        size="small"
                                        variant="text"
                                        endIcon={<OpenInNew fontSize="small" />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/crm/cases/${entry.case_id}`,
                                          );
                                        }}
                                      >
                                        К делу
                                      </Button>
                                    )}
                                  </>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {isSharedWithCurrentUser(entry) ? (
                                <Chip
                                  size="small"
                                  color="info"
                                  icon={<MoveToInbox />}
                                  label="Передано вам"
                                  variant="outlined"
                                />
                              ) : hasShareInfo(entry) ? (
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={{ cursor: "pointer" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareEntry(entry);
                                    setShareInfoOpen(true);
                                  }}
                                >
                                  {(entry.share_info?.recipient_count ?? 0) > 0 && (
                                    <Tooltip title="Передано сотрудникам">
                                      <Chip
                                        size="small"
                                        icon={<Group sx={{ fontSize: 14 }} />}
                                        label={entry.share_info?.recipient_count}
                                      />
                                    </Tooltip>
                                  )}
                                  {(entry.share_info?.public_link_count ?? 0) > 0 && (
                                    <Tooltip title="Публичные ссылки">
                                      <Chip
                                        size="small"
                                        icon={<LinkIcon sx={{ fontSize: 14 }} />}
                                        label={entry.share_info?.public_link_count}
                                      />
                                    </Tooltip>
                                  )}
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {entry.type === "folder"
                                  ? "-"
                                  : formatFileSize(entry.size)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {dayjs(entry.created_at).format(
                                  "DD.MM.YYYY HH:mm",
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Person
                                  sx={{ fontSize: 14, color: "text.primary" }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ opacity: 0.85 }}
                                >
                                  {formatCreatorName(entry)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 1.5 }}>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuClick(e, entry);
                                }}
                                sx={{
                                  opacity: isDragging ? 0 : 1,
                                  transition: "opacity 0.2s",
                                  visibility: isDragging ? "hidden" : "visible",
                                  mr: 0.5,
                                  p: 1,
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Пагинация */}
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              px: 2,
              py: 1.5,
            }}
          >
            <PaginationControls
              currentPage={page + 1}
              totalPages={paginationMeta?.total_pages || 1}
              totalItems={total}
              hasPrev={paginationMeta?.has_prev ?? page > 0}
              hasNext={paginationMeta?.has_next ?? false}
              limit={rowsPerPage}
              limitOptions={[10, 25, 50, 100]}
              onLimitChange={handleChangeRowsPerPage}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
            />
          </Box>
        </Paper>

        {/* Контекстное меню */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {selectedEntryIds.length <= 1 && menuEntry?.type === "file" && (
            <MenuItem onClick={handleMenuPreview}>
              <Visibility sx={{ mr: 1 }} />
              Предпросмотр
            </MenuItem>
          )}
          {selectedEntryIds.length <= 1 && (
            <MenuItem onClick={handleMenuEdit}>
              <Edit sx={{ mr: 1 }} />
              Редактировать
            </MenuItem>
          )}
          {selectedEntryIds.length <= 1 && menuEntry && isOwnedResource(menuEntry) && canShare && (
            <MenuItem onClick={() => {
              openShareDialog(menuEntry);
              handleMenuClose();
            }}>
              <Share sx={{ mr: 1 }} />
              Поделиться
            </MenuItem>
          )}
          {selectedEntryIds.length <= 1 && menuEntry && isOwnedResource(menuEntry) && hasShareInfo(menuEntry) && (
            <MenuItem onClick={() => {
              setShareEntry(menuEntry);
              setShareInfoOpen(true);
              handleMenuClose();
            }}>
              <Group sx={{ mr: 1 }} />
              Кому передан
            </MenuItem>
          )}
          {(menuEntry?.type === "file" || selectedEntryIds.length > 1) && (
            <MenuItem onClick={handleMenuDownload}>
              <Download sx={{ mr: 1 }} />
              {selectedEntryIds.length > 1
                ? `Скачать выбранное (${selectedEntryIds.length})`
                : "Скачать"}
            </MenuItem>
          )}
          {menuEntry?.type === "folder" && (
            <MenuItem onClick={handleMenuDownloadFolder}>
              <Download sx={{ mr: 1 }} />
              Скачать папку
            </MenuItem>
          )}
          {(selectedEntryIds.length > 1 ||
            (menuEntry &&
              menuEntry.id &&
              typeof menuEntry.id === "string" &&
              !menuEntry.id.startsWith("__"))) && (
            <MenuItem onClick={handleMenuDelete} sx={{ color: "error.main" }}>
              <DeleteSweep sx={{ mr: 1 }} />
              {selectedEntryIds.length > 1
                ? `В корзину выбранное (${selectedEntryIds.length})`
                : "В корзину"}
            </MenuItem>
          )}
        </Menu>

        {/* Оверлей для drag-and-drop */}
        {dragOverTable && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 15,
              pointerEvents: "none",
              borderRadius: 2,
              border: "2px dashed",
              borderColor: "primary.main",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                py: 2,
                px: 3,
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="body1" fontWeight={600} color="primary.main">
                Отпустите файлы для загрузки
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
      )}

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Передача доступа{shareEntry ? `: ${shareEntry.name}` : ""}</DialogTitle>
        <DialogContent>
          <Tabs value={shareTab} onChange={(_, next) => setShareTab(next)} sx={{ mb: 2 }}>
            <Tab label="Сотрудники" />
            <Tab label="Публичная ссылка" />
          </Tabs>

          {shareTab === 0 ? (
            <Stack spacing={2}>
              <Autocomplete
                multiple
                options={recipientOptions}
                getOptionLabel={(option) => `${option.full_name} (${option.email})`}
                value={selectedRecipients}
                onChange={(_, value) => setSelectedRecipients(value)}
                onInputChange={(_, value) => setRecipientQuery(value)}
                renderInput={(params) => <TextField {...params} label="Получатели" placeholder="Введите имя или email" />}
              />
              <RadioGroup row value={permissionLevel} onChange={(e) => setPermissionLevel(e.target.value as "view" | "edit")}>
                <FormControlLabel value="view" control={<Radio />} label="Просмотр" />
                <FormControlLabel value="edit" control={<Radio />} label="Редактирование" />
              </RadioGroup>
              <FormControlLabel
                control={<Checkbox checked={canDownloadShare} onChange={(e) => setCanDownloadShare(e.target.checked)} />}
                label="Разрешить скачивание"
              />
              <TextField
                label="Срок действия"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <TextField
                label="Сообщение"
                multiline
                minRows={3}
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Button variant="contained" onClick={handleCreatePublicLink} disabled={createLinkShare.isPending}>
                Создать ссылку
              </Button>
              {(publicLink || getShareLinkUrl(shareResourceQuery.data?.public_links?.[0] ?? {})) && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                      <LinkIcon sx={{ verticalAlign: "middle", mr: 1, fontSize: 16 }} />
                      {publicLink || getShareLinkUrl(shareResourceQuery.data?.public_links?.[0] ?? {})}
                    </Typography>
                    <Button
                      onClick={() => navigator.clipboard.writeText(publicLink || getShareLinkUrl(shareResourceQuery.data?.public_links?.[0] ?? {}) || "")}
                    >
                      Копировать
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Отмена</Button>
          {shareTab === 0 && (
            <Button variant="contained" onClick={handleSubmitUserShare} disabled={selectedRecipients.length === 0 || createUserShare.isPending}>
              Передать доступ
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareInfoOpen}
        onClose={() => setShareInfoOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { minHeight: 520 } }}
      >
        <DialogTitle sx={{ pr: 6 }}>Кому передан: {shareEntry?.name}</DialogTitle>
        <IconButton
          aria-label="Закрыть"
          onClick={() => setShareInfoOpen(false)}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <Close />
        </IconButton>

        <DialogContent dividers sx={{ overflowX: "hidden", px: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Сотрудники</Typography>
          <List disablePadding>
            {(shareResourceQuery.data?.recipients ?? []).map((recipient, index) => {
              const recipientBatchId = getShareBatchId(recipient);
              const expireSoon = recipient.expires_at && dayjs(recipient.expires_at).diff(dayjs(), "day") <= 3;
              return (
                <ListItem key={recipientBatchId || recipient.user_id || `recipient-${index}`} disableGutters sx={{ py: 1.25 }}>
                  <Box sx={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 2, alignItems: "start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {recipient.full_name || recipient.recipient_name || recipient.email || recipient.recipient_email || "Сотрудник"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${recipient.permission_level === "edit" ? "Редактирование" : "Просмотр"} · Скачивание ${recipient.can_download ? "✓" : "✗"}${expireSoon ? " ⚠️" : ""}`}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      sx={{ textTransform: "none", color: "text.secondary", minWidth: 92, justifySelf: "end" }}
                      disabled={!recipientBatchId}
                      onClick={() => recipientBatchId && revokeShare.mutate(recipientBatchId)}
                    >
                      Отозвать
                    </Button>
                  </Box>
                </ListItem>
              );
            })}
          </List>

          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Публичные ссылки</Typography>
          <List disablePadding>
            {(shareResourceQuery.data?.public_links ?? []).map((link, index) => {
              const linkBatchId = getShareBatchId(link);
              const linkUrl = getShareLinkUrl(link);
              const linkLabel = linkUrl || `Ссылка ${linkBatchId.length > 0 ? linkBatchId.slice(0, 6) : index + 1}`;
              return (
                <ListItem key={linkBatchId || linkUrl || `public-link-${index}`} disableGutters sx={{ py: 1.25 }}>
                  <Box sx={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 2, alignItems: "start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ wordBreak: "break-all" }} title={linkLabel}>
                        {getCompactShareLink(linkLabel)}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">👁 {link.current_views ?? 0}</Typography>
                        <Typography variant="caption" color="text.secondary">⬇ {link.current_downloads ?? 0}</Typography>
                        {linkUrl && (
                          <Button
                            size="small"
                            sx={{ textTransform: "none", p: 0, minWidth: "unset" }}
                            onClick={() => navigator.clipboard.writeText(linkUrl)}
                          >
                            Копировать
                          </Button>
                        )}
                      </Stack>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      color="inherit"
                      sx={{ textTransform: "none", color: "text.secondary", minWidth: 92, justifySelf: "end" }}
                      disabled={!linkBatchId}
                      onClick={() => linkBatchId && revokeShare.mutate(linkBatchId)}
                    >
                      Отозвать
                    </Button>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setShareInfoOpen(false)} sx={{ textTransform: "none" }}>
            Закрыть
          </Button>
          {canShare && shareEntry && (
            <Button variant="contained" onClick={() => { setShareInfoOpen(false); openShareDialog(shareEntry, 0); }} sx={{ textTransform: "none" }}>
              + Добавить получателя
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Скрытый input для выбора файлов */}
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

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEntryIds.length > 1 && !entryToDelete
            ? "Массовое перемещение в корзину"
            : entryToDelete?.type === "folder"
              ? "Перемещение папки в корзину"
              : entryToDelete?.type === "file"
                ? "Перемещение файла в корзину"
                : "Перемещение элемента в корзину"}
        </DialogTitle>
        <DialogContent>
          {selectedEntryIds.length > 1 && !entryToDelete ? (
            <>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Вы уверены, что хотите переместить в корзину
                <strong> {selectedEntryIds.length}</strong> выбранных элементов?
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Это действие переместит все выбранные документы и папки в корзину.
                Их можно будет восстановить позже.
              </Alert>
            </>
          ) : entryToDelete && entryToDelete.name ? (
            <>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Вы уверены, что хотите переместить в корзину{" "}
                <strong>
                  {entryToDelete.type === "folder" ? "папку" : "файл"}
                  {` "${entryToDelete.name}"`}
                </strong>
                ?
              </Typography>
              {entryToDelete.type === "folder" && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Внимание: папка и всё её содержимое будут перемещены в корзину.
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="error" sx={{ mt: 2 }}>
              Не удалось определить элемент для удаления. Элемент мог быть
              удален или перемещён.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setEntryToDelete(null);
            }}
            color="primary"
            sx={actionButtonSx}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={
              trashAssets.isPending ||
              (selectedEntryIds.length <= 1 &&
                (!entryToDelete || !entryToDelete.id))
            }
            sx={actionButtonSx}
          >
            {trashAssets.isPending ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            В корзину
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания папки */}
      <Dialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
      >
        <DialogTitle>Создать папку</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название папки"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
            error={!newFolderName.trim() && newFolderName.length > 0}
            helperText={
              !newFolderName.trim() && newFolderName.length > 0
                ? "Название не может быть пустым"
                : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateFolderOpen(false)}
            sx={actionButtonSx}
          >
            Отмена
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || createFolder.isPending}
            sx={actionButtonSx}
          >
            {createFolder.isPending ? (
              <CircularProgress size={20} />
            ) : (
              "Создать"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог загрузки файлов */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadTitle("");
          setUploadCaseId("");
          setSelectedCase(null);
          setCaseSearchQuery("");
          setDragOverUploadDialog(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузить файлы и папки</DialogTitle>
        <DialogContent>
          {isUploading && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Загружается: {uploadingFileName || "файл"}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {uploadProgress}%
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
          <Box sx={{ mb: 3, mt: 1 }}>
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
              sx={{ mb: 2 }}
              placeholder="Оставьте пустым для использования имён файлов"
              helperText="Если указано, будет использовано для всех файлов"
            />
            <Autocomplete
              options={caseSuggestions || []}
              getOptionLabel={(option) =>
                `${option.number} - ${option.case_number}`
              }
              value={selectedCase}
              onChange={(_, newValue) => setSelectedCase(newValue)}
              inputValue={caseSearchQuery}
              onInputChange={(_, newInputValue) =>
                setCaseSearchQuery(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Привязать к делу (необязательно)"
                  placeholder="Начните вводить номер дела..."
                  helperText="Введите минимум 1 символ для поиска"
                />
              )}
              noOptionsText={
                caseSearchQuery.length === 0
                  ? "Введите номер дела"
                  : "Дела не найдены"
              }
              sx={{ mb: 3 }}
            />
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
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
            </Stack>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: dragOverUploadDialog
                  ? "primary.dark"
                  : "primary.main",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: dragOverUploadDialog
                  ? "primary.lighter"
                  : "action.hover",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.lighter",
                },
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  const filteredFiles = files.filter(
                    (file) => !isSystemOrTempFile(file),
                  );
                  setSelectedFiles((prev) => [...prev, ...filteredFiles]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="body1" fontWeight="medium" mb={1}>
                {selectedFiles.length > 0
                  ? `Добавить ещё файлов или папок (${selectedFiles.length} выбрано)`
                  : "Перетащите файлы/папки сюда или нажмите для выбора"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Поддерживаются все типы файлов
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFiles([]);
              setUploadTitle("");
              setUploadCaseId("");
              setSelectedCase(null);
              setCaseSearchQuery("");
              setDragOverUploadDialog(false);
            }}
            sx={actionButtonSx}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={
              selectedFiles.length === 0 ||
              isUploading ||
              createFolder.isPending
            }
            sx={actionButtonSx}
          >
            {isUploading ? (
              <CircularProgress size={20} />
            ) : (
              `Загрузить ${selectedFiles.length} файл(ов)`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования */}
      <EditAssetDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEntryToEdit(null);
        }}
        onSave={handleSaveEdit}
        entry={entryToEdit}
        loading={updateAsset.isPending}
      />
    </Box>
  );
}
