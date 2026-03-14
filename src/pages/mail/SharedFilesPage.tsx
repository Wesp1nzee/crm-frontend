import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close, Download, Preview } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { mailApi } from "../../entities/mail/api";
import type { OversizedMailFile } from "../../entities/mail/types";
import { notificationService } from "../../shared/services/notifications";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
};

const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith("image/")) return "🖼";
  if (contentType === "application/pdf") return "📄";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType.includes("zip") || contentType.includes("archive")) return "🗜";
  if (contentType.includes("word") || contentType.includes("document")) return "📝";
  if (contentType.includes("sheet") || contentType.includes("excel")) return "📊";
  return "📎";
};

const canPreview = (contentType: string) =>
  contentType.startsWith("image/") ||
  contentType === "application/pdf" ||
  contentType.startsWith("video/") ||
  contentType.startsWith("audio/");

const isNotFoundError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 404;

export function SharedFilesPage() {
  const { token } = useParams<{ token: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<OversizedMailFile | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const filesQuery = useQuery({
    queryKey: ["mail", "oversized", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("missing_token");
      }
      const response = await mailApi.getOversizedBatch(token);
      return response.data;
    },
    enabled: Boolean(token),
    retry: (count, error) => !isNotFoundError(error) && count < 1,
  });

  const isTokenInvalid = useMemo(
    () => !token || filesQuery.error?.message === "missing_token" || isNotFoundError(filesQuery.error),
    [token, filesQuery.error],
  );

  const handleDownload = (fileId: string) => {
    if (!token) return;
    window.open(mailApi.getOversizedDownloadUrl(token, fileId), "_blank", "noopener,noreferrer");
  };

  const handleDownloadZip = () => {
    if (!token) return;
    window.open(mailApi.getOversizedZipUrl(token), "_blank", "noopener,noreferrer");
  };

  const handleOpenPreview = async (file: OversizedMailFile) => {
    if (!token || !canPreview(file.content_type)) return;

    setPreviewLoadingId(file.id);
    try {
      const response = await mailApi.getOversizedPreviewUrl(token, file.id);
      setPreviewFile(file);
      setPreviewUrl(response.data.url);
      setPreviewOpen(true);
    } catch {
      notificationService.error("Не удалось открыть предпросмотр файла");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const renderPreview = () => {
    if (!previewUrl || !previewFile) return null;

    if (previewFile.content_type.startsWith("image/")) {
      return (
        <Box component="img" src={previewUrl} alt={previewFile.filename} sx={{ maxWidth: "100%", maxHeight: "75vh" }} />
      );
    }

    if (previewFile.content_type === "application/pdf") {
      return <Box component="iframe" src={previewUrl} width="100%" height="75vh" sx={{ border: 0 }} />;
    }

    if (previewFile.content_type.startsWith("video/")) {
      return <Box component="video" src={previewUrl} controls autoPlay sx={{ maxWidth: "100%", maxHeight: "75vh" }} />;
    }

    if (previewFile.content_type.startsWith("audio/")) {
      return <Box component="audio" src={previewUrl} controls autoPlay sx={{ width: "100%" }} />;
    }

    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            📎 Файлы из письма
          </Typography>
          {filesQuery.data?.created_at && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Отправлено {new Date(filesQuery.data.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </Typography>
          )}
        </Box>

        <Button variant="contained" startIcon={<Download />} onClick={handleDownloadZip} disabled={!filesQuery.data?.files.length}>
          Скачать всё ZIP
        </Button>
      </Stack>

      {filesQuery.isLoading && (
        <Box py={8} textAlign="center">
          <CircularProgress />
        </Box>
      )}

      {!filesQuery.isLoading && isTokenInvalid && (
        <Alert severity="warning">Ссылка недействительна или была деактивирована.</Alert>
      )}

      {!filesQuery.isLoading && !isTokenInvalid && filesQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void filesQuery.refetch()}>
              Повторить
            </Button>
          }
        >
          Не удалось загрузить файлы. Проверьте подключение.
        </Alert>
      )}

      {!filesQuery.isLoading && !filesQuery.isError && filesQuery.data?.files.length === 0 && (
        <Alert severity="info">Файлы не найдены.</Alert>
      )}

      {!filesQuery.isLoading && !filesQuery.isError && (filesQuery.data?.files.length ?? 0) > 0 && (
        <Grid container spacing={2}>
          {filesQuery.data?.files.map((file) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={file.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h3" mb={1}>
                    {getFileIcon(file.content_type)}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: "break-word" }}>
                    {file.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatFileSize(file.file_size)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Tooltip title={canPreview(file.content_type) ? "Предпросмотр" : "Для этого типа превью недоступно"}>
                    <span>
                      <IconButton
                        onClick={() => void handleOpenPreview(file)}
                        disabled={!canPreview(file.content_type) || previewLoadingId === file.id}
                      >
                        <Preview />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton onClick={() => handleDownload(file.id)}>
                    <Download />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 7 }}>
          {previewFile?.filename}
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>{renderPreview()}</DialogContent>
      </Dialog>
    </Container>
  );
}
