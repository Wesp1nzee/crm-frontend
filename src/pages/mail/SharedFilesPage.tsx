import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Download, OpenInNew, Refresh } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { mailApi } from "../../entities/mail/api";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
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

const isPreviewable = (contentType: string) =>
  contentType.startsWith("image/") ||
  contentType === "application/pdf" ||
  contentType.startsWith("video/");

const isNotFoundError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 404;

function CompanyLogo() {
  return (
    <Box
      component="svg"
      viewBox="0 0 220 48"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ width: 180, height: 40 }}
      aria-label="Company logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6A5CFF" />
          <stop offset="100%" stopColor="#1EC8FF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logoGrad)" />
      <path d="M14 31L23 13l10 18 7-12" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="58" y="29" fill="#111827" fontSize="18" fontWeight="700" fontFamily="Inter, Arial, sans-serif">
        EXPERT CRM
      </text>
    </Box>
  );
}

export function SharedFilesPage() {
  const { token } = useParams<{ token: string }>();

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

  const isInvalidLink = useMemo(
    () => !token || filesQuery.error?.message === "missing_token" || isNotFoundError(filesQuery.error),
    [token, filesQuery.error],
  );

  const createdAtLabel = useMemo(() => {
    if (!filesQuery.data?.created_at) return "";
    return new Date(filesQuery.data.created_at).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [filesQuery.data?.created_at]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(circle at 10% 10%, rgba(122,140,255,0.16), transparent 40%), radial-gradient(circle at 90% 20%, rgba(30,200,255,0.18), transparent 35%), linear-gradient(180deg, #F7F9FF 0%, #EEF3FF 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider", backdropFilter: "blur(8px)" }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Stack spacing={1}>
                <CompanyLogo />
                <Typography variant="h4" fontWeight={800}>
                  Крупные вложения из письма
                </Typography>
                <Typography color="text.secondary">
                  Безопасный публичный доступ по токен-ссылке без авторизации.
                </Typography>
              </Stack>

              {!!token && (
                <Chip
                  label={`Token: ${token.slice(0, 8)}…`}
                  sx={{ fontWeight: 600, bgcolor: "rgba(106,92,255,0.08)", border: "1px solid rgba(106,92,255,0.22)" }}
                />
              )}
            </Stack>

            <Divider />

            {filesQuery.isLoading && (
              <Box py={8} textAlign="center">
                <CircularProgress />
                <Typography color="text.secondary" mt={2}>
                  Загружаем список файлов...
                </Typography>
              </Box>
            )}

            {!filesQuery.isLoading && isInvalidLink && (
              <Alert severity="warning">Ссылка недействительна или срок действия истёк.</Alert>
            )}

            {!filesQuery.isLoading && !isInvalidLink && filesQuery.isError && (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => void filesQuery.refetch()} startIcon={<Refresh />}>
                    Попробовать снова
                  </Button>
                }
              >
                Что-то пошло не так. Проверьте подключение и попробуйте снова.
              </Alert>
            )}

            {!filesQuery.isLoading && !filesQuery.isError && filesQuery.data?.files.length === 0 && (
              <Alert severity="info">Файлы не найдены.</Alert>
            )}

            {!filesQuery.isLoading && !filesQuery.isError && (filesQuery.data?.files.length ?? 0) > 0 && (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                  <Typography color="text.secondary">Отправлено: {createdAtLabel}</Typography>
                  {(filesQuery.data?.files.length ?? 0) > 1 && (
                    <Button
                      component="a"
                      href={mailApi.getOversizedZipUrl(token ?? "")}
                      variant="contained"
                      startIcon={<Download />}
                    >
                      Скачать все файлы
                    </Button>
                  )}
                </Stack>

                <Grid container spacing={2.5}>
                  {filesQuery.data?.files.map((file) => (
                    <Grid key={file.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          borderColor: "rgba(106,92,255,0.18)",
                          boxShadow: "0 12px 30px rgba(31,41,55,0.06)",
                        }}
                      >
                        <CardContent>
                          <Typography fontSize={42}>{getFileIcon(file.content_type)}</Typography>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, wordBreak: "break-word" }}>
                            {file.filename}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {formatFileSize(file.file_size)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            {file.content_type || "application/octet-stream"}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: "wrap" }}>
                          {isPreviewable(file.content_type) && (
                            <Button
                              component="a"
                              href={`/api/mail/oversized/${token}/${file.id}/preview`}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                              startIcon={<OpenInNew />}
                            >
                              Открыть
                            </Button>
                          )}
                          <Button
                            component="a"
                            href={mailApi.getOversizedDownloadUrl(token ?? "", file.id)}
                            size="small"
                            startIcon={<Download />}
                          >
                            Скачать
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
