import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useShareInbox } from "../../shared/hooks/useShare";

export function ShareInboxPage() {
  const { data, isLoading } = useShareInbox();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>Доступно мне</Typography>
      {(data ?? []).map((item) => (
        <Card key={item.batch_id} variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
              <Box>
                <Typography fontWeight={600}>{item.resource.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  От: {item.sender_name} · {dayjs(item.created_at).format("DD MMM YYYY")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.permission_level === "edit" ? "Редактирование" : "Просмотр"} · Скачивание {item.can_download ? "✓" : "✗"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Срок: {item.expires_at ? `до ${dayjs(item.expires_at).format("DD MMM YYYY")}` : "бессрочно"}
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => {
                  if (item.resource.document_id) {
                    navigate(`/crm/documents?open=${item.resource.document_id}`);
                  }
                }}
              >
                Открыть файл
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
