import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Download,
  Refresh,
  ViewModule,
  ViewList,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  FolderZip,
  Description,
  TableChart,
  Slideshow,
  Code,
  TextSnippet,
  Search,
  Sort,
  ContentCopy,
  Close,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { mailApi } from "../../entities/mail/api";

import logoPng from "../../shared/assets/logo.png";
import { notificationService } from "../../shared/services/notifications";
import { useOversizedDownloads } from "../../shared/hooks/useOversizedDownloads";
import { useFilePreview } from "../../shared/hooks/useFilePreview";
import { useFileFilterSort, type SortField } from "../../shared/hooks/useFileFilterSort";
import { PasswordDialog } from "./PasswordDialog";
import { FilePreviewDialog } from "./FilePreviewDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const getFriendlyType = (contentType: string): string => {
  if (!contentType) return "FILE";
  const ct = contentType.toLowerCase();

  if (ct.startsWith("image/")) return ct.replace("image/", "").toUpperCase();
  if (ct === "application/pdf") return "PDF";
  if (ct.startsWith("video/")) return ct.replace("video/", "").toUpperCase();
  if (ct.startsWith("audio/")) return ct.replace("audio/", "").toUpperCase();

  if (ct.includes("wordprocessingml") || ct.includes("msword")) return "DOCX";
  if (ct.includes("spreadsheetml") || ct.includes("vnd.ms-excel")) return "XLSX";
  if (ct.includes("presentationml") || ct.includes("vnd.ms-powerpoint")) return "PPTX";

  if (ct.includes("zip") || ct.includes("rar") || ct.includes("7z") || ct.includes("archive")) return "ZIP";

  if (ct.includes("json")) return "JSON";
  if (ct.includes("xml")) return "XML";
  if (ct.includes("csv")) return "CSV";
  if (ct.startsWith("text/")) return "TXT";

  return "FILE";
};

const FileIcon = ({ contentType, size = 26 }: { contentType: string; size?: number }) => {
  const s = { fontSize: size };
  const ct = contentType?.toLowerCase() || "";

  if (ct.startsWith("image/")) return <Image sx={{ ...s, color: "#10b981" }} />;
  if (ct === "application/pdf") return <PictureAsPdf sx={{ ...s, color: "#ef4444" }} />;
  if (ct.startsWith("video/")) return <VideoFile sx={{ ...s, color: "#8b5cf6" }} />;
  if (ct.startsWith("audio/")) return <AudioFile sx={{ ...s, color: "#f59e0b" }} />;

  if (ct.includes("wordprocessingml") || ct.includes("msword")) return <Description sx={{ ...s, color: "#3b82f6" }} />;
  if (ct.includes("spreadsheetml") || ct.includes("vnd.ms-excel")) return <TableChart sx={{ ...s, color: "#22c55e" }} />;
  if (ct.includes("presentationml") || ct.includes("vnd.ms-powerpoint")) return <Slideshow sx={{ ...s, color: "#f43f5e" }} />;

  if (ct.includes("zip") || ct.includes("archive") || ct.includes("rar")) return <FolderZip sx={{ ...s, color: "#f97316" }} />;
  if (ct.includes("json") || ct.includes("xml") || ct.includes("html")) return <Code sx={{ ...s, color: "#06b6d4" }} />;
  if (ct.startsWith("text/")) return <TextSnippet sx={{ ...s, color: "#94a3b8" }} />;

  return <InsertDriveFile sx={{ ...s, color: "#94a3b8" }} />;
};

const isPreviewable = (ct: string | undefined | null): boolean => {
  if (!ct) return false;
  const contentType = ct.trim().toLowerCase();

  return (
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType.startsWith("video/") ||
    contentType.startsWith("text/") ||
    contentType.includes("wordprocessingml") ||
    contentType.includes("msword") ||
    contentType.includes("spreadsheetml") ||
    contentType.includes("vnd.ms-excel") ||
    contentType.includes("presentationml") ||
    contentType.includes("vnd.ms-powerpoint") ||
    contentType === "application/json"
  );
};

const getHttpStatus = (error: unknown): number | undefined => {
  if (error instanceof AxiosError) return error.response?.status;
  return undefined;
};

const filePlural = (count: number): string => {
  if (count === 1) return "файл";
  if (count >= 2 && count <= 4) return "файла";
  return "файлов";
};

// ---------------------------------------------------------------------------
// Background watermark & header (reused)
// ---------------------------------------------------------------------------

function BgWatermark() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src={logoPng}
        alt=""
        sx={{
          width: "136vmin",
          maxWidth: "1120px",
          minWidth: "640px",
          opacity: 0.12,
          filter: "grayscale(100%)",
          userSelect: "none",
        }}
      />
    </Box>
  );
}

function CompanyHeader() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box sx={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Box component="img" src={logoPng} alt="Логотип" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </Box>
      <Box>
        <Typography sx={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          ООО Экспертиза
        </Typography>
        <Typography sx={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", fontWeight: 500, fontSize: "0.68rem", color: "#64748b", letterSpacing: "0.06em", textTransform: "none" }}>
          защищённая передача файлов
        </Typography>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileItem = { id: string; filename: string; content_type: string; file_size: number };

// ---------------------------------------------------------------------------
// File Card (grid view) — memoized
// ---------------------------------------------------------------------------

interface FileCardGridProps {
  file: FileItem;
  token: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (id: string, filename: string, ct: string) => void;
  onDownload: (id: string, filename: string) => void;
  onCopyLink: (url: string) => void;
  downloadProgress?: number;
  isDownloading: boolean;
}

const FileCardGrid = ({
  file,
  token,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onCopyLink,
  downloadProgress,
  isDownloading,
}: FileCardGridProps) => {
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const canPreview = isPreviewable(file.content_type);
  const downloadUrl = mailApi.getOversizedDownloadUrl(token, file.id);

  return (
    <Card
      variant="outlined"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: "100%",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: selected
          ? "rgba(79,70,229,0.5)"
          : hovered
            ? "rgba(79,70,229,0.38)"
            : "rgba(148,163,184,0.18)",
        background: selected
          ? "rgba(79,70,229,0.04)"
          : hovered
            ? "linear-gradient(145deg,#fff,#f5f3ff)"
            : "rgba(255,255,255,0.6)",
        boxShadow: hovered ? "0 20px 60px rgba(79,70,229,0.13),0 4px 16px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.04)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#4f46e5,#06b6d4)", opacity: hovered || selected ? 1 : 0, transition: "opacity 0.2s" }} />

      {/* Checkbox overlay */}
      <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
        <Checkbox
          size="small"
          checked={selected}
          onChange={() => onToggleSelect(file.id)}
          sx={{ p: 0.5, bgcolor: "rgba(255,255,255,0.8)", borderRadius: "6px" }}
        />
      </Box>

      <CardContent sx={{ pt: 5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ width: 52, height: 52, borderRadius: "12px", bgcolor: "rgba(79,70,229,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileIcon contentType={file.content_type} size={26} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word", lineHeight: 1.35, fontSize: "0.85rem", color: "#0f172a" }}>
              {file.filename}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              <Box sx={{ px: 0.75, py: 0.15, borderRadius: "5px", bgcolor: "rgba(79,70,229,0.09)", fontSize: "0.65rem", fontWeight: 700, color: "#4f46e5", letterSpacing: "0.04em" }}>
                {getFriendlyType(file.content_type)}
              </Box>
              <Typography variant="caption" color="text.secondary" fontSize="0.72rem">{formatFileSize(file.file_size)}</Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Download progress */}
        {isDownloading && downloadProgress !== undefined && downloadProgress > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 4, borderRadius: 2 }} />
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem" mt={0.25} textAlign="center" display="block">
              {downloadProgress}%
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{
        px: 2, pb: 2, pt: 0.5, gap: 1, flexWrap: "wrap",
        opacity: hovered || isMobile ? 1 : 0,
        transform: hovered || isMobile ? "translateY(0)" : "translateY(6px)",
        transition: "all 0.2s ease",
      }}>
        {canPreview && (
          <Button
            size="small"
            onClick={() => onPreview(file.id, file.filename, file.content_type)}
            sx={{
              fontSize: "0.72rem", px: 1.5, py: 0.5, borderRadius: "8px",
              textTransform: "none",
              border: "1px solid rgba(79,70,229,0.28)",
              color: "#4f46e5",
              "&:hover": { bgcolor: "rgba(79,70,229,0.08)" },
            }}
          >
            Просмотр
          </Button>
        )}
        <Button
          size="small"
          onClick={() => onDownload(file.id, file.filename)}
          startIcon={<Download sx={{ fontSize: 14 }} />}
          sx={{
            fontSize: "0.72rem", px: 1.5, py: 0.5, borderRadius: "8px",
            textTransform: "none",
            bgcolor: "rgba(79,70,229,0.07)",
            color: "#4338ca",
            "&:hover": { bgcolor: "rgba(79,70,229,0.14)" },
          }}
        >
          Скачать
        </Button>
        <Tooltip title="Копировать ссылку">
          <IconButton
            size="small"
            onClick={() => onCopyLink(downloadUrl)}
            sx={{ color: "#64748b", "&:hover": { bgcolor: "rgba(79,70,229,0.08)" } }}
          >
            <ContentCopy sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// File Row (list view) — memoized
// ---------------------------------------------------------------------------

interface FileRowListProps {
  file: FileItem;
  token: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (id: string, filename: string, ct: string) => void;
  onDownload: (id: string, filename: string) => void;
  onCopyLink: (url: string) => void;
  downloadProgress?: number;
  isDownloading: boolean;
}

const FileRowList = ({
  file,
  token,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onCopyLink,
  downloadProgress,
  isDownloading,
}: FileRowListProps) => {
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const canPreview = isPreviewable(file.content_type);
  const downloadUrl = mailApi.getOversizedDownloadUrl(token, file.id);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2.5,
        py: 1.75,
        borderRadius: "14px",
        border: "1px solid",
        borderColor: selected
          ? "rgba(79,70,229,0.4)"
          : hovered
            ? "rgba(79,70,229,0.28)"
            : "rgba(148,163,184,0.14)",
        bgcolor: selected
          ? "rgba(79,70,229,0.06)"
          : hovered
            ? "rgba(79,70,229,0.03)"
            : "rgba(255,255,255,0.4)",
        transition: "all 0.18s ease",
        cursor: "default",
      }}
    >
      <Checkbox
        size="small"
        checked={selected}
        onChange={() => onToggleSelect(file.id)}
        sx={{ p: 0.5, flexShrink: 0 }}
      />

      <Box sx={{ width: 44, height: 44, borderRadius: "11px", bgcolor: "rgba(79,70,229,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileIcon contentType={file.content_type} size={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: "#0f172a", fontSize: "0.87rem" }}>
          {file.filename}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.25, borderRadius: "6px", bgcolor: "rgba(79,70,229,0.09)", fontSize: "0.65rem", fontWeight: 700, color: "#4f46e5", letterSpacing: "0.05em", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
        {getFriendlyType(file.content_type)}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, width: 72, textAlign: "right", display: { xs: "none", md: "block" } }}>
        {formatFileSize(file.file_size)}
      </Typography>

      {/* Inline download progress for list view */}
      {isDownloading && downloadProgress !== undefined && downloadProgress > 0 && (
        <Box sx={{ width: 80, flexShrink: 0 }}>
          <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 4, borderRadius: 2 }} />
        </Box>
      )}

      <Stack direction="row" spacing={0.5} sx={{
        flexShrink: 0,
        opacity: hovered || isMobile ? 1 : 0,
        transition: "opacity 0.15s",
      }}>
        {canPreview && (
          <Tooltip title="Просмотр">
            <IconButton
              size="small"
              onClick={() => onPreview(file.id, file.filename, file.content_type)}
              sx={{ color: "#4f46e5", "&:hover": { bgcolor: "rgba(79,70,229,0.09)" } }}
            >
              <Image sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Скачать">
          <IconButton
            size="small"
            onClick={() => onDownload(file.id, file.filename)}
            sx={{ color: "#4338ca", "&:hover": { bgcolor: "rgba(79,70,229,0.09)" } }}
          >
            <Download sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Копировать ссылку">
          <IconButton
            size="small"
            onClick={() => onCopyLink(downloadUrl)}
            sx={{ color: "#64748b", "&:hover": { bgcolor: "rgba(79,70,229,0.09)" } }}
          >
            <ContentCopy sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function GridSkeletons() {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: "16px", height: 180 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: "12px" }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="80%" height={20} />
                  <Skeleton width="40%" height={16} sx={{ mt: 1 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function ListSkeletons() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 1.75, borderRadius: "14px", border: "1px solid rgba(148,163,184,0.14)", bgcolor: "rgba(255,255,255,0.4)" }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "11px" }} />
          <Skeleton width="50%" height={20} sx={{ flex: 1 }} />
          <Skeleton width={50} height={20} sx={{ display: { xs: "none", sm: "block" } }} />
          <Skeleton width={60} height={16} sx={{ display: { xs: "none", md: "block" } }} />
        </Box>
      ))}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Sort header helper
// ---------------------------------------------------------------------------

function SortHeaderCell({
  label,
  field,
  activeField,
  order,
  onSort,
  sx,
}: {
  label: string;
  field: SortField;
  activeField: SortField;
  order: "asc" | "desc";
  onSort: (f: SortField) => void;
  sx?: object;
}) {
  const isActive = field === activeField;
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontSize: "0.7rem",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        userSelect: "none",
        "&:hover": { color: "#4f46e5" },
        ...sx,
      }}
      onClick={() => onSort(field)}
    >
      {label}
      <Sort
        sx={{
          fontSize: 14,
          transform: isActive ? (order === "desc" ? "rotate(180deg)" : "none") : "none",
          opacity: isActive ? 1 : 0.3,
          transition: "transform 0.15s",
        }}
      />
    </Typography>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function SharedFilesPage() {
  const { token } = useParams<{ token: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Password state for 401 handling
  const [password, setPassword] = useState<string | undefined>();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // NOTE: Query with increased retry/stale/gc times.
  // When a 401 is detected, we prompt for password and refetch.
  const filesQuery = useQuery({
    queryKey: ["mail", "oversized", token, password ? "auth" : "public"],
    queryFn: async () => {
      if (!token) throw new Error("missing_token");
      // NOTE: If the backend supports password via query param or header,
      // it should be added here. Currently the getOversizedBatch doesn't
      // accept a password param — we rely on the error handler below.
      // If 401 is returned, the useEffect below prompts the user.
      const response = await mailApi.getOversizedBatch(token);
      return response.data;
    },
    enabled: Boolean(token),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
  });

  // Handle 401 — show password dialog
  const httpStatus = getHttpStatus(filesQuery.error);
  const isUnauthorized = httpStatus === 401;

  // Auto-show password dialog on 401
  useEffect(() => {
    if (isUnauthorized && !showPasswordDialog) {
      setShowPasswordDialog(true);
    }
  }, [isUnauthorized, showPasswordDialog]);

  const isForbidden = httpStatus === 403;
  const isGone = httpStatus === 410;
  const isRateLimited = httpStatus === 429;
  const isNotFoundError = httpStatus === 404;

  const handlePasswordSubmit = useCallback(
    (pwd: string) => {
      setPassword(pwd);
      setShowPasswordDialog(false);
      setPasswordError("");
      void filesQuery.refetch();
    },
    [filesQuery],
  );

  const createdAt = filesQuery.data?.created_at;
  const createdAtLabel = useMemo(() => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [createdAt]);

  const files: FileItem[] = filesQuery.data?.files ?? [];

  // File selection, search, sort
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    handleSort,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    isAllSelected,
    filteredAndSorted,
  } = useFileFilterSort(files);

  // Download management
  const downloadHooks = useOversizedDownloads(token ?? "", password);
  const {
    fileProgress,
    batchProgress,
    isDownloading,
    downloadFile,
    cancelFile: _cancelFile,
    resetAll: _resetAll,
    downloadBatch,
    cancelBatch,
  } = downloadHooks;

  // Preview management
  const preview = useFilePreview(token ?? "");

  // Copy link to clipboard
  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notificationService.success("Ссылка скопирована");
    } catch {
      notificationService.error("Не удалось скопировать ссылку");
    }
  }, []);

  // Download selected files
  const handleDownloadSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const metas = files.filter((f) => ids.includes(f.id));
    void downloadBatch(ids, metas);
  }, [selectedIds, files, downloadBatch]);

  // Download all files
  const handleDownloadAll = useCallback(() => {
    const ids = filteredAndSorted.map((f) => f.id);
    void downloadBatch(ids, filteredAndSorted);
  }, [filteredAndSorted, downloadBatch]);

  const fileCount = files.length;
  const filteredCount = filteredAndSorted.length;
  const hasSelection = selectedIds.size > 0;

  // Error alert content
  const renderErrorAlert = () => {
    if (isGone) {
      return (
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          Срок действия ссылки истёк. Файлы больше недоступны.
        </Alert>
      );
    }
    if (isForbidden) {
      return (
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          Доступ к этим файлам отозван. Обратитесь к отправителю.
        </Alert>
      );
    }
    if (isRateLimited) {
      return (
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          Слишком много запросов. Подождите немного и попробуйте снова.
        </Alert>
      );
    }
    if (isNotFoundError || filesQuery.error?.message === "missing_token") {
      return (
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          Ссылка недействительна или срок действия истёк.
        </Alert>
      );
    }
    return (
      <Alert
        severity="error"
        sx={{ borderRadius: "14px" }}
        action={
          <Button color="inherit" size="small" onClick={() => void filesQuery.refetch()} startIcon={<Refresh />} sx={{ textTransform: "none", fontWeight: 600 }}>
            Повторить
          </Button>
        }
      >
        Не удалось загрузить файлы. Проверьте подключение.
      </Alert>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        background:
          "radial-gradient(ellipse 70% 50% at 15% -5%, rgba(79,70,229,0.09) 0%, transparent 60%)," +
          "radial-gradient(ellipse 55% 40% at 85% 5%, rgba(6,182,212,0.09) 0%, transparent 55%)," +
          "linear-gradient(180deg,#f1f5f9 0%,#eef2ff 100%)",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <BgWatermark />

      <Box sx={{ position: "relative", zIndex: 1, minHeight: "100vh", px: { xs: 2, sm: 3, md: 4, lg: 6 }, py: { xs: 3, md: 5 }, maxWidth: 1440, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "24px",
            border: "1px solid rgba(148,163,184,0.18)",
            bgcolor: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            overflow: "hidden",
            minHeight: "calc(100vh - 80px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ---- Header ---- */}
          <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: 3, md: 4 }, pb: 3, borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Stack spacing={1.5}>
                <CompanyHeader />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.45rem", md: "1.8rem" }, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                    Вложения из письма
                  </Typography>
                  {createdAtLabel && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.82rem" }}>
                      Отправлено {createdAtLabel}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  {/* View mode toggle */}
                  <Box sx={{ display: "flex", bgcolor: "rgba(79,70,229,0.07)", borderRadius: "10px", p: "3px" }}>
                    {(["grid", "list"] as const).map((mode) => (
                      <Tooltip key={mode} title={mode === "grid" ? "Плитка" : "Список"}>
                        <IconButton
                          key={mode}
                          size="small"
                          onClick={() => setViewMode(mode)}
                          sx={{
                            borderRadius: "8px",
                            px: 1.2,
                            py: 0.7,
                            bgcolor: viewMode === mode ? "#fff" : "transparent",
                            boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                            color: viewMode === mode ? "#4f46e5" : "#94a3b8",
                            transition: "all 0.18s",
                          }}
                        >
                          {mode === "grid" ? <ViewModule sx={{ fontSize: 18 }} /> : <ViewList sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>

                  {/* Download selected button */}
                  {hasSelection && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleDownloadSelected}
                      disabled={isDownloading}
                      startIcon={<Download sx={{ fontSize: 16 }} />}
                      sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: "0.78rem" }}
                    >
                      Скачать выбранные ({selectedIds.size})
                    </Button>
                  )}

                  {fileCount > 1 && !hasSelection && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleDownloadAll}
                      disabled={isDownloading}
                      startIcon={<Download sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        px: 2.5,
                        py: 1,
                        background: "linear-gradient(135deg,#4f46e5,#4338ca)",
                        boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
                        "&:hover": { background: "linear-gradient(135deg,#4338ca,#3730a3)", boxShadow: "0 6px 20px rgba(79,70,229,0.45)" },
                      }}
                    >
                      Скачать все
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>

            {/* Batch download progress bar */}
            {isDownloading && batchProgress.total > 0 && (
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                    Загрузка: {batchProgress.completed}/{batchProgress.total} завершено
                    {batchProgress.failed > 0 && `, ошибок: ${batchProgress.failed}`}
                  </Typography>
                  <Button size="small" onClick={cancelBatch} sx={{ textTransform: "none", fontSize: "0.7rem", color: "#ef4444" }}>
                    Отмена
                  </Button>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={batchProgress.total > 0 ? Math.round((batchProgress.completed / batchProgress.total) * 100) : 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Search & select toolbar */}
            {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && (
              <Box sx={{ mt: 2, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  placeholder="Поиск по имени файла…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    flex: { xs: 1, sm: "auto" },
                    minWidth: { xs: 0, sm: 220 },
                    maxWidth: 360,
                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  }}
                />

                {/* Select all / deselect all */}
                {fileCount > 1 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={isAllSelected ? deselectAll : selectAll}
                    sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.75rem" }}
                  >
                    {isAllSelected ? "Снять все" : "Выбрать все"}
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {/* ---- Content ---- */}
          <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 }, flex: 1 }}>
            {/* Loading */}
            {filesQuery.isLoading && viewMode === "grid" && <GridSkeletons />}
            {filesQuery.isLoading && viewMode === "list" && <ListSkeletons />}

            {/* Errors */}
            {!filesQuery.isLoading && filesQuery.isError && renderErrorAlert()}

            {/* Empty */}
            {!filesQuery.isLoading && !filesQuery.isError && fileCount === 0 && (
              <Alert severity="info" sx={{ borderRadius: "14px" }}>Файлы не найдены.</Alert>
            )}

            {/* No search results */}
            {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && filteredCount === 0 && (
              <Alert severity="info" sx={{ borderRadius: "14px" }}>
                По запросу «{searchQuery}» ничего не найдено.
              </Alert>
            )}

            {/* Grid view */}
            {!filesQuery.isLoading && !filesQuery.isError && filteredCount > 0 && viewMode === "grid" && (
              <>
                <Typography variant="caption" sx={{ display: "block", mb: 2.5, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                  {filteredCount} {filePlural(filteredCount)}
                  {searchQuery && ` из ${fileCount}`}
                </Typography>
                <Grid container spacing={2}>
                  {filteredAndSorted.map((file) => (
                    <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <FileCardGrid
                        file={file}
                        token={token ?? ""}
                        selected={selectedIds.has(file.id)}
                        onToggleSelect={toggleSelect}
                        onPreview={preview.openPreview}
                        onDownload={downloadFile}
                        onCopyLink={handleCopyLink}
                        downloadProgress={fileProgress.get(file.id)?.progress}
                        isDownloading={isDownloading || fileProgress.has(file.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* List view */}
            {!filesQuery.isLoading && !filesQuery.isError && filteredCount > 0 && viewMode === "list" && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 1, mb: 1 }}>
                  <Box sx={{ width: 44, flexShrink: 0 }} />
                  <Box sx={{ width: 44, flexShrink: 0 }} />
                  <SortHeaderCell label="Название" field="filename" activeField={sortField} order={sortOrder} onSort={handleSort} sx={{ flex: 1 }} />
                  <SortHeaderCell label="Тип" field="content_type" activeField={sortField} order={sortOrder} onSort={handleSort} sx={{ width: 60, display: { xs: "none", sm: "block" } }} />
                  <SortHeaderCell label="Размер" field="file_size" activeField={sortField} order={sortOrder} onSort={handleSort} sx={{ width: 72, textAlign: "right", display: { xs: "none", md: "block" }, justifyContent: "flex-end" }} />
                  <Box sx={{ width: 80, flexShrink: 0 }} />
                </Box>
                <Stack spacing={1}>
                  {filteredAndSorted.map((file) => (
                    <FileRowList
                      key={file.id}
                      file={file}
                      token={token ?? ""}
                      selected={selectedIds.has(file.id)}
                      onToggleSelect={toggleSelect}
                      onPreview={preview.openPreview}
                      onDownload={downloadFile}
                      onCopyLink={handleCopyLink}
                      downloadProgress={fileProgress.get(file.id)?.progress}
                      isDownloading={isDownloading || fileProgress.has(file.id)}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Box>

          {/* ---- Footer ---- */}
          <Box sx={{ px: { xs: 3, md: 5 }, py: 2, borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.disabled" fontSize="0.72rem">
              © {new Date().getFullYear()} ООО Экспертиза — защищённая передача файлов
            </Typography>
            {fileCount > 0 && (
              <Typography variant="caption" color="text.disabled" fontSize="0.72rem">
                {fileCount} {filePlural(fileCount)}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Password dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPasswordError("");
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />

      {/* File preview dialog */}
      <FilePreviewDialog
        open={preview.isOpen}
        onClose={preview.closePreview}
        filename={preview.previewFilename}
        contentType={preview.previewContentType}
        previewUrl={preview.previewUrl}
        loading={preview.previewUrlLoading}
        error={preview.previewUrlError}
        onDownload={() => {
          if (preview.previewFileId) {
            const f = files.find((ff) => ff.id === preview.previewFileId);
            if (f) downloadFile(f.id, f.filename);
          }
        }}
      />
    </Box>
  );
}
