import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { Close, Download, ErrorOutline } from "@mui/icons-material";

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  filename: string;
  contentType: string;
  previewUrl: string | null;
  loading: boolean;
  error: unknown;
  onDownload: () => void;
}

/**
 * Dialog for inline preview of files.
 * Supports: images, PDFs, video, text.
 * Falls back to a download button for unsupported types.
 */
export function FilePreviewDialog({
  open,
  onClose,
  filename,
  contentType,
  previewUrl,
  loading,
  error,
  onDownload,
}: FilePreviewDialogProps) {
  const isImage = contentType?.startsWith("image/");
  const isPdf = contentType === "application/pdf";
  const isVideo = contentType?.startsWith("video/");
  const isText =
    contentType?.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/xml";

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#4f46e5", mb: 2 }} />
          <Typography color="text.secondary" fontSize="0.85rem">
            Загрузка превью…
          </Typography>
        </Box>
      );
    }

    if (error || !previewUrl) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            gap: 2,
          }}
        >
          <ErrorOutline sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography color="text.secondary" textAlign="center">
            Не удалось загрузить превью
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={onDownload}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" },
            }}
          >
            Скачать файл
          </Button>
        </Box>
      );
    }

    if (isImage) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            maxHeight: "70vh",
            bgcolor: "#f8fafc",
          }}
        >
          <img
            src={previewUrl}
            alt={filename}
            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "4px" }}
          />
        </Box>
      );
    }

    if (isPdf) {
      return (
        <Box sx={{ minHeight: 500, maxHeight: "75vh" }}>
          <iframe
            src={previewUrl}
            title={filename}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 500,
              border: "none",
              borderRadius: "4px",
            }}
          />
        </Box>
      );
    }

    if (isVideo) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            bgcolor: "#000",
            borderRadius: "4px",
          }}
        >
          <video
            controls
            autoPlay
            style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "4px" }}
          >
            <source src={previewUrl} type={contentType} />
            Ваш браузер не поддерживаетет видео.
          </video>
        </Box>
      );
    }

    if (isText) {
      return (
        <Box sx={{ minHeight: 300, maxHeight: "70vh" }}>
          <iframe
            src={previewUrl}
            title={filename}
            style={{
              width: "100%",
              height: "100%",
              minHeight: 300,
              border: "none",
              borderRadius: "4px",
            }}
          />
        </Box>
      );
    }

    // Unsupported type
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          gap: 2,
        }}
      >
        <ErrorOutline sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography color="text.secondary" textAlign="center">
          Превью недоступно для этого типа файла
        </Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={onDownload}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "#4f46e5",
            "&:hover": { bgcolor: "#4338ca" },
          }}
        >
          Скачать файл
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{ maxWidth: "85%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {filename}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Download sx={{ fontSize: 16 }} />}
            onClick={onDownload}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.75rem" }}
          >
            Скачать
          </Button>
          <IconButton onClick={onClose} size="small" sx={{ color: "#64748b" }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pt: 2, pb: 1 }}>{renderContent()}</DialogContent>
    </Dialog>
  );
}
