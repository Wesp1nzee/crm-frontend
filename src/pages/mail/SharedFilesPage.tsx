import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
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
  OpenInNew,
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
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { mailApi } from "../../entities/mail/api";

import logoPng from "../../shared/assets/logo.png";

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

const isNotFoundError = (error: unknown) => error instanceof AxiosError && error.response?.status === 404;

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

type FileItem = { id: string; filename: string; content_type: string; file_size: number };

function FileCardGrid({ file, token }: { file: FileItem; token: string }) {
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Card
      variant="outlined"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: "100%",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: hovered ? "rgba(79,70,229,0.38)" : "rgba(148,163,184,0.18)",
        background: hovered ? "linear-gradient(145deg,#fff,#f5f3ff)" : "rgba(255,255,255,0.6)",
        boxShadow: hovered ? "0 20px 60px rgba(79,70,229,0.13),0 4px 16px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.04)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#4f46e5,#06b6d4)", opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }} />
      <CardContent>
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
      </CardContent>
      <CardActions sx={{ 
        px: 2, pb: 2, pt: 0.5, gap: 1, flexWrap: "wrap", 
        opacity: hovered || isMobile ? 1 : 0, 
        transform: hovered || isMobile ? "translateY(0)" : "translateY(6px)", 
        transition: "all 0.2s ease" 
      }}>
        {file.content_type && isPreviewable(file.content_type) && (
          <Button 
            component="a" 
            href={`/api/mail/oversized/${token}/${file.id}/preview`} 
            target="_blank" 
            rel="noreferrer" 
            size="small" 
            startIcon={<OpenInNew sx={{ fontSize: 14 }} />} 
            sx={{ 
              fontSize: "0.72rem", px: 1.5, py: 0.5, borderRadius: "8px", 
              textTransform: "none", 
              border: "1px solid rgba(79,70,229,0.28)", 
              color: "#4f46e5", 
              "&:hover": { bgcolor: "rgba(79,70,229,0.08)" } 
            }}
          >
            Просмотр
          </Button>
        )}
        <Button 
          component="a" 
          href={mailApi.getOversizedDownloadUrl(token, file.id)} 
          size="small" 
          startIcon={<Download sx={{ fontSize: 14 }} />} 
          sx={{ 
            fontSize: "0.72rem", px: 1.5, py: 0.5, borderRadius: "8px", 
            textTransform: "none", 
            bgcolor: "rgba(79,70,229,0.07)", 
            color: "#4338ca", 
            "&:hover": { bgcolor: "rgba(79,70,229,0.14)" } 
          }}
        >
          Скачать
        </Button>
      </CardActions>
    </Card>
  );
}

function FileRowList({ file, token }: { file: FileItem; token: string }) {
  const [hovered, setHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
        borderColor: hovered ? "rgba(79,70,229,0.28)" : "rgba(148,163,184,0.14)", 
        bgcolor: hovered ? "rgba(79,70,229,0.03)" : "rgba(255,255,255,0.4)", 
        transition: "all 0.18s ease", 
        cursor: "default" 
      }}
    >
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
      <Stack direction="row" spacing={0.5} sx={{ 
        flexShrink: 0, 
        opacity: hovered || isMobile ? 1 : 0, 
        transition: "opacity 0.15s" 
      }}>
        {file.content_type && isPreviewable(file.content_type) && (
          <Tooltip title="Просмотр">
            <IconButton 
              component="a" 
              href={`/api/mail/oversized/${token}/${file.id}/preview`} 
              target="_blank" 
              rel="noreferrer" 
              size="small" 
              sx={{ color: "#4f46e5", "&:hover": { bgcolor: "rgba(79,70,229,0.09)" } }}
            >
              <OpenInNew sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Скачать">
          <IconButton 
            component="a" 
            href={mailApi.getOversizedDownloadUrl(token, file.id)} 
            size="small" 
            sx={{ color: "#4338ca", "&:hover": { bgcolor: "rgba(79,70,229,0.09)" } }}
          >
            <Download sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

export function SharedFilesPage() {
  const { token } = useParams<{ token: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filesQuery = useQuery({
    queryKey: ["mail", "oversized", token],
    queryFn: async () => {
      if (!token) throw new Error("missing_token");
      const response = await mailApi.getOversizedBatch(token);
      return response.data;
    },
    enabled: Boolean(token),
    retry: (count, error) => !isNotFoundError(error) && count < 1,
  });

  const isInvalidLink = useMemo(() => !token || filesQuery.error?.message === "missing_token" || isNotFoundError(filesQuery.error), [token, filesQuery.error]);

  const createdAt = filesQuery.data?.created_at;

  const createdAtLabel = useMemo(() => {
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleString("ru-RU", { 
      day: "2-digit", 
      month: "long", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }, [createdAt]);

  const files: FileItem[] = filesQuery.data?.files ?? [];
  const fileCount = files.length;

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
          <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: 3, md: 4 }, pb: 3, borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Stack spacing={1.5}>
                <CompanyHeader />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.45rem", md: "1.8rem" }, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.2 }}>Вложения из письма</Typography>
                  {createdAtLabel && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.82rem" }}>Отправлено {createdAtLabel}</Typography>}
                </Box>
              </Stack>

              {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ display: "flex", bgcolor: "rgba(79,70,229,0.07)", borderRadius: "10px", p: "3px" }}>
                    {(["grid", "list"] as const).map((mode) => (
                      <Tooltip key={mode} title={mode === "grid" ? "Плитка" : "Список"}>
                        <IconButton size="small" onClick={() => setViewMode(mode)} sx={{ borderRadius: "8px", px: 1.2, py: 0.7, bgcolor: viewMode === mode ? "#fff" : "transparent", boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none", color: viewMode === mode ? "#4f46e5" : "#94a3b8", transition: "all 0.18s" }}>
                          {mode === "grid" ? <ViewModule sx={{ fontSize: 18 }} /> : <ViewList sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                  {fileCount > 1 && (
                    <Button component="a" href={mailApi.getOversizedZipUrl(token ?? "")} variant="contained" startIcon={<Download sx={{ fontSize: 17 }} />} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: "0.85rem", px: 2.5, py: 1, background: "linear-gradient(135deg,#4f46e5,#4338ca)", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", "&:hover": { background: "linear-gradient(135deg,#4338ca,#3730a3)", boxShadow: "0 6px 20px rgba(79,70,229,0.45)" } }}>
                      Скачать все
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 3, md: 4 }, flex: 1 }}>
            {filesQuery.isLoading && (
              <Box py={12} textAlign="center">
                <CircularProgress size={44} sx={{ color: "#4f46e5", "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }} />
                <Typography color="text.secondary" mt={2.5} fontSize="0.9rem">Загружаем файлы…</Typography>
              </Box>
            )}

            {!filesQuery.isLoading && isInvalidLink && <Alert severity="warning" sx={{ borderRadius: "14px" }}>Ссылка недействительна или срок действия истёк.</Alert>}

            {!filesQuery.isLoading && !isInvalidLink && filesQuery.isError && (
              <Alert severity="error" sx={{ borderRadius: "14px" }} action={<Button color="inherit" size="small" onClick={() => void filesQuery.refetch()} startIcon={<Refresh />} sx={{ textTransform: "none", fontWeight: 600 }}>Повторить</Button>}>
                Не удалось загрузить файлы. Проверьте подключение.
              </Alert>
            )}

            {!filesQuery.isLoading && !filesQuery.isError && fileCount === 0 && <Alert severity="info" sx={{ borderRadius: "14px" }}>Файлы не найдены.</Alert>}

            {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && viewMode === "grid" && (
              <>
                <Typography variant="caption" sx={{ display: "block", mb: 2.5, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8" }}>
                  {fileCount} {fileCount === 1 ? "файл" : fileCount < 5 ? "файла" : "файлов"}
                </Typography>
                <Grid container spacing={2}>
                  {files.map((file) => (
                    <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <FileCardGrid file={file} token={token ?? ""} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {!filesQuery.isLoading && !filesQuery.isError && fileCount > 0 && viewMode === "list" && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 1, mb: 1 }}>
                  <Box sx={{ width: 44, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem" }}>Название</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem", display: { xs: "none", sm: "block" }, width: 60 }}>Тип</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem", display: { xs: "none", md: "block" }, width: 72, textAlign: "right" }}>Размер</Typography>
                  <Box sx={{ width: 80, flexShrink: 0 }} />
                </Box>
                <Stack spacing={1}>
                  {files.map((file) => <FileRowList key={file.id} file={file} token={token ?? ""} />)}
                </Stack>
              </>
            )}
          </Box>

          <Box sx={{ px: { xs: 3, md: 5 }, py: 2, borderTop: "1px solid rgba(148,163,184,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.disabled" fontSize="0.72rem">© {new Date().getFullYear()} ООО Экспертиза — защищённая передача файлов</Typography>
            {fileCount > 0 && <Typography variant="caption" color="text.disabled" fontSize="0.72rem">{fileCount} {fileCount === 1 ? "файл" : fileCount < 5 ? "файла" : "файлов"}</Typography>}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}