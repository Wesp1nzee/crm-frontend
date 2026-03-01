import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { shareApi } from "../../../entities/share/api";

export function PublicSharePage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const load = async (withPassword?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await shareApi.accessPublicLink(token, withPassword);
      setData(response);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setError("Неверный пароль");
      else if (status === 404) setError("Ссылка недействительна");
      else if (status === 410) setError("Срок действия ссылки истёк");
      else setError("Не удалось открыть ссылку");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <Box maxWidth={480} mx="auto" py={8}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Публичный доступ к документам</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Введите пароль (если требуется)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={() => load(password || undefined)} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : "Открыть"}
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box maxWidth={720} mx="auto" py={8}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={700}>Доступные ресурсы</Typography>
        {data.resources?.map((resource: any, index: number) => (
          <Box key={`${resource.name}-${index}`} p={2} border="1px solid" borderColor="divider" borderRadius={2}>
            <Typography fontWeight={600}>{resource.name}</Typography>
            <Typography variant="body2" color="text.secondary">Тип: {resource.type === "folder" ? "Папка" : "Файл"}</Typography>
          </Box>
        ))}
        {data.can_download && (
          <Button
            variant="outlined"
            onClick={() => shareApi.registerDownload(token)}
          >
            Скачать
          </Button>
        )}
      </Stack>
    </Box>
  );
}
