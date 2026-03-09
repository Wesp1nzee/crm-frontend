import { useMemo, useState } from "react";
import {
  Add,
  Archive,
  ArrowBack,
  Delete,
  Drafts,
  Inbox,
  Menu,
  Refresh,
  Send,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  Paper,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { MailFolder, MailMessageListItem } from "../../entities/mail/types";
import {
  useMailMessage,
  useMailMessages,
  useMailStats,
  usePatchMailMessage,
  useSyncMailFolder,
} from "../../shared/hooks/useMail";
import { MailComposer } from "./MailComposer";

const folderMeta: Array<{ id: MailFolder; label: string }> = [
  { id: "inbox", label: "Входящие" },
  { id: "sent", label: "Отправленные" },
  { id: "drafts", label: "Черновики" },
  { id: "spam", label: "Спам" },
  { id: "trash", label: "Корзина" },
];

const folderIcon = (folder: MailFolder) => {
  if (folder === "inbox") return <Inbox />;
  if (folder === "sent") return <Send />;
  if (folder === "drafts") return <Drafts />;
  if (folder === "spam") return <Archive />;
  return <Delete />;
};

export function MailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<MailFolder>("inbox");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const { data: stats } = useMailStats();
  const { data: messagesData, isLoading } = useMailMessages({
    folder: selectedFolder,
    is_read: showUnreadOnly ? false : undefined,
    page: 1,
    page_size: 50,
  });

  const { data: selectedMessage } = useMailMessage(selectedMessageId ?? "");
  const patchMessage = usePatchMailMessage();
  const syncFolder = useSyncMailFolder();

  const messages = useMemo(() => messagesData?.items ?? [], [messagesData]);

  const selectMessage = async (message: MailMessageListItem) => {
    setSelectedMessageId(message.id);
    if (!message.is_read) {
      await patchMessage.mutateAsync({
        messageId: message.id,
        payload: { is_read: true },
      });
    }
  };

  const handleRefresh = async () => {
    await syncFolder.mutateAsync(selectedFolder);
  };

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Почта</Typography>
      </Box>

      <List>
        <ListItem disablePadding sx={{ px: 1 }}>
          <Button
            fullWidth
            startIcon={<Add />}
            variant="contained"
            onClick={() => setComposerOpen(true)}
          >
            Написать
          </Button>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      <List>
        {folderMeta.map((folder) => (
          <ListItem key={folder.id} disablePadding sx={{ px: 1, py: 0.25 }}>
            <Button
              fullWidth
              onClick={() => {
                setSelectedFolder(folder.id);
                setSelectedMessageId(null);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ justifyContent: "flex-start" }}
              startIcon={
                folder.id === "inbox" ? (
                  <Badge badgeContent={stats?.inbox ?? 0} color="error">
                    {folderIcon(folder.id)}
                  </Badge>
                ) : (
                  folderIcon(folder.id)
                )
              }
            >
              {folder.label}
            </Button>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ px: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Switch
          size="small"
          checked={showUnreadOnly}
          onChange={(event) => setShowUnreadOnly(event.target.checked)}
        />
        <Typography variant="body2">Только непрочитанные</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 120px)", minHeight: 600 }}>
      {!isMobile && (
        <Box sx={{ borderRight: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          {drawer}
        </Box>
      )}

      {isMobile && (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {drawer}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)}>
              <Menu />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {folderMeta.find((folder) => folder.id === selectedFolder)?.label}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={syncFolder.isPending}>
            <Refresh />
          </IconButton>
        </Box>

        {!selectedMessageId ? (
          <Box sx={{ p: 2, overflow: "auto" }}>
            {isLoading && <Typography>Загрузка...</Typography>}
            {!isLoading && messages.length === 0 && (
              <Typography color="text.secondary">Нет писем в этой папке.</Typography>
            )}
            <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {messages.map((message) => (
                <Paper
                  key={message.id}
                  variant="outlined"
                  sx={{ p: 2, cursor: "pointer", borderLeft: message.is_read ? undefined : "4px solid", borderLeftColor: "primary.main" }}
                  onClick={() => void selectMessage(message)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: message.is_read ? 500 : 700 }}>
                    {message.subject || "(без темы)"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {message.sender_name || message.sender_email}
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.processed_at).toLocaleString("ru-RU")}
                    </Typography>
                    {message.has_attachments && <Chip label="Вложения" size="small" variant="outlined" />}
                  </Box>
                </Paper>
              ))}
            </List>
          </Box>
        ) : (
          <Box sx={{ p: 2, overflow: "auto" }}>
            <Button startIcon={<ArrowBack />} onClick={() => setSelectedMessageId(null)}>
              Назад к списку
            </Button>

            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6">{selectedMessage?.subject || "(без темы)"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                От: {selectedMessage?.sender_name || selectedMessage?.sender_email}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {selectedMessage?.content?.body_text || "Нет текстового содержимого"}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      <MailComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </Box>
  );
}
