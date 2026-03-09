import { type MouseEvent, useMemo, useState } from "react";
import {
  Add,
  Archive,
  ArrowBack,
  Delete,
  Drafts,
  Inbox,
  Menu,
  Refresh,
  Search,
  Send,
  Star,
} from "@mui/icons-material";
import {
  alpha,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  OutlinedInput,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { MailFolder, MailMessageListItem } from "../../entities/mail/types";
import {
  useBulkMailAction,
  useMailMessage,
  useMailMessages,
  useMailSearch,
  useMailStats,
  usePatchMailMessage,
  useSyncMailFolder,
} from "../../shared/hooks/useMail";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { MailComposer } from "./MailComposer";

const folderMeta: Array<{ id: MailFolder; label: string }> = [
  { id: "inbox", label: "Входящие" },
  { id: "sent", label: "Отправленные" },
  { id: "drafts", label: "Черновики" },
  { id: "spam", label: "Спам" },
  { id: "trash", label: "Корзина" },
];

const folderIcon = (folder: MailFolder) => {
  if (folder === "inbox") return <Inbox fontSize="small" />;
  if (folder === "sent") return <Send fontSize="small" />;
  if (folder === "drafts") return <Drafts fontSize="small" />;
  if (folder === "spam") return <Archive fontSize="small" />;
  return <Delete fontSize="small" />;
};

const glassSurface = {
  borderRadius: "20px",
  backdropFilter: "blur(16px)",
  background: `linear-gradient(140deg, ${alpha("#FFFFFF", 0.7)} 0%, ${alpha("#EFF4FF", 0.56)} 100%)`,
  border: `1px solid ${alpha("#A4B6DA", 0.38)}`,
  boxShadow: `0 16px 32px ${alpha("#5D74A1", 0.14)}`,
};

export function MailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<MailFolder>("inbox");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const { data: stats } = useMailStats();
  const { data: messagesData, isLoading } = useMailMessages({
    folder: selectedFolder,
    is_read: showUnreadOnly ? false : undefined,
    page: 1,
    page_size: 50,
  });

  const { data: searchData, isFetching: isSearchFetching } = useMailSearch(
    { q: debouncedSearch, page: 1, page_size: 50 },
    debouncedSearch.length > 1,
  );

  const { data: selectedMessage } = useMailMessage(selectedMessageId ?? "");
  const patchMessage = usePatchMailMessage();
  const syncFolder = useSyncMailFolder();
  const bulkAction = useBulkMailAction();

  const baseMessages = useMemo(() => messagesData?.items ?? [], [messagesData]);

  const messages = useMemo(() => {
    if (!debouncedSearch) {
      return baseMessages;
    }
    return (searchData?.items ?? []).filter((message) => message.folder === selectedFolder);
  }, [baseMessages, debouncedSearch, searchData?.items, selectedFolder]);

  const resetSelection = () => setSelectedIds([]);

  const selectMessage = async (message: MailMessageListItem) => {
    setSelectedMessageId(message.id);
    if (!message.is_read) {
      await patchMessage.mutateAsync({
        messageId: message.id,
        payload: { is_read: true },
      });
    }
  };

  const toggleSelection = (messageId: string) => {
    setSelectedIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId],
    );
  };

  const handleBulkAction = async (
    action: "read" | "unread" | "star" | "unstar" | "archive" | "delete",
  ) => {
    if (selectedIds.length === 0) return;
    await bulkAction.mutateAsync({ messageIds: selectedIds, action });
    resetSelection();
  };

  const handleQuickAction = async (
    event: MouseEvent,
    messageId: string,
    payload: Parameters<typeof patchMessage.mutateAsync>[0]["payload"],
  ) => {
    event.stopPropagation();
    await patchMessage.mutateAsync({ messageId, payload });
  };

  const handleRefresh = async () => {
    await syncFolder.mutateAsync(selectedFolder);
  };

  const drawer = (
    <Box
      sx={{
        width: 280,
        p: 1.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box sx={{ px: 1, pt: 0.5, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Mail / Inbox
        </Typography>
      </Box>

      <Button
        startIcon={<Add />}
        variant="contained"
        onClick={() => setComposerOpen(true)}
        sx={{
          borderRadius: 99,
          mx: 1,
          py: 1,
          boxShadow: `0 12px 24px ${alpha("#2563EB", 0.28)}`,
          background: "linear-gradient(120deg, #2563EB 0%, #3B82F6 100%)",
        }}
      >
        Compose
      </Button>

      <List sx={{ pt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {folderMeta.map((folder) => {
          const active = selectedFolder === folder.id;
          return (
            <ListItem key={folder.id} disablePadding sx={{ px: 0.5 }}>
              <Button
                fullWidth
                onClick={() => {
                  setSelectedFolder(folder.id);
                  setSelectedMessageId(null);
                  resetSelection();
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 99,
                  px: 1.25,
                  py: 0.75,
                  color: active ? "#17336E" : "#3E4D6D",
                  background: active
                    ? `linear-gradient(130deg, ${alpha("#D7E4FF", 0.9)} 0%, ${alpha("#EEF3FF", 0.76)} 100%)`
                    : "transparent",
                  boxShadow: active
                    ? `inset 0 0 0 1px ${alpha("#94ADDF", 0.45)}, 0 8px 18px ${alpha("#8BA0C8", 0.25)}`
                    : "none",
                }}
                startIcon={
                  folder.id === "inbox" ? (
                    <Badge badgeContent={stats?.inbox ?? 0} color="primary">
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
          );
        })}
      </List>

      <Divider sx={{ my: 0.5 }} />

      <Box sx={{ px: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Switch
          size="small"
          checked={showUnreadOnly}
          onChange={(event) => setShowUnreadOnly(event.target.checked)}
        />
        <Typography variant="body2" sx={{ color: "#50607E" }}>
          Только непрочитанные
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 120px)",
        minHeight: 620,
        borderRadius: 6,
        p: 1.5,
        gap: 1.5,
        background: `radial-gradient(circle at 12% 18%, ${alpha("#B7C8FF", 0.4)} 0%, transparent 38%),
          radial-gradient(circle at 84% 82%, ${alpha("#A8D4FF", 0.32)} 0%, transparent 42%),
          linear-gradient(150deg, #EFF2FF 0%, #E7F0FF 58%, #E4EDFF 100%)`,
      }}
    >
      {!isMobile && <Box sx={{ ...glassSurface }}>{drawer}</Box>}

      {isMobile && (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {drawer}
        </Drawer>
      )}

      <Box sx={{ ...glassSurface, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${alpha("#9AB1DA", 0.33)}`,
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
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {folderMeta.find((folder) => folder.id === selectedFolder)?.label}
          </Typography>
          <IconButton onClick={handleRefresh} disabled={syncFolder.isPending}>
            <Refresh />
          </IconButton>
        </Box>

        {!selectedMessageId ? (
          <Box sx={{ p: 1.25, overflow: "auto" }}>
            <OutlinedInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              fullWidth
              size="small"
              placeholder="Поиск писем..."
              startAdornment={
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "#4B5A7A" }} />
                </InputAdornment>
              }
              sx={{
                mb: 1.25,
                borderRadius: 99,
                backdropFilter: "blur(12px)",
                backgroundColor: alpha("#FFFFFF", 0.55),
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha("#9EB3DA", 0.42),
                },
              }}
            />

            {selectedIds.length > 0 && (
              <Paper
                sx={{
                  mb: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 99,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: alpha("#E9F0FF", 0.92),
                  border: `1px solid ${alpha("#8DA8DD", 0.5)}`,
                }}
              >
                <Chip label={`${selectedIds.length} selected`} size="small" color="primary" />
                <Button size="small" onClick={() => void handleBulkAction("archive")}>Archive</Button>
                <Button size="small" onClick={() => void handleBulkAction("star")}>Star</Button>
                <Button size="small" onClick={() => void handleBulkAction("read")}>Read</Button>
                <Button size="small" color="error" onClick={() => void handleBulkAction("delete")}>
                  Delete
                </Button>
              </Paper>
            )}

            {(isLoading || isSearchFetching) && <Typography>Загрузка...</Typography>}
            {!isLoading && !isSearchFetching && messages.length === 0 && (
              <Typography color="text.secondary">Нет писем в этой папке.</Typography>
            )}

            <List sx={{ display: "flex", flexDirection: "column", gap: 0.75, p: 0 }}>
              {messages.map((message) => {
                const isSelected = selectedIds.includes(message.id);
                return (
                  <Paper
                    key={message.id}
                    variant="outlined"
                    sx={{
                      px: 1.2,
                      py: 0.8,
                      borderRadius: "16px",
                      minHeight: 64,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      borderColor: isSelected
                        ? alpha("#2563EB", 0.6)
                        : alpha(message.is_read ? "#8EA4CC" : "#2563EB", message.is_read ? 0.35 : 0.55),
                      backgroundColor: alpha("#FFFFFF", message.is_read ? 0.68 : 0.86),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: `0 10px 24px ${alpha("#5D74A1", 0.16)}`,
                        "& .quick-actions": {
                          opacity: 1,
                          transform: "translateX(0)",
                        },
                      },
                    }}
                    onClick={() => void selectMessage(message)}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelection(message.id)}
                    />

                    <Box sx={{ minWidth: 190, maxWidth: 220 }}>
                      <Typography variant="body2" sx={{ color: "#5A6885" }} noWrap>
                        {message.sender_name || message.sender_email}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: message.is_read ? 600 : 800, color: "#1C2B4D" }}
                      >
                        {message.subject || "(без темы)"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.8} alignItems="center">
                      {message.has_attachments && (
                        <Chip label="Files" size="small" sx={{ height: 20, borderRadius: 99 }} />
                      )}
                      <Typography variant="caption" sx={{ color: "#607193", minWidth: 120 }}>
                        {new Date(message.processed_at).toLocaleString("ru-RU")}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.25}
                      className="quick-actions"
                      sx={{
                        opacity: 0,
                        transform: "translateX(4px)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <Tooltip title="Star">
                        <IconButton
                          size="small"
                          onClick={(event) =>
                            void handleQuickAction(event, message.id, { is_starred: !message.is_starred })
                          }
                        >
                          <Star fontSize="small" sx={{ color: message.is_starred ? "#2563EB" : undefined }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Archive">
                        <IconButton
                          size="small"
                          onClick={(event) => void handleQuickAction(event, message.id, { is_archived: true })}
                        >
                          <Archive fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Trash">
                        <IconButton
                          size="small"
                          onClick={(event) => void handleQuickAction(event, message.id, { is_deleted: true })}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </List>
          </Box>
        ) : (
          <Box sx={{ p: 2, overflow: "auto" }}>
            <Button startIcon={<ArrowBack />} onClick={() => setSelectedMessageId(null)}>
              Назад к списку
            </Button>

            <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: "20px" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedMessage?.subject || "(без темы)"}
              </Typography>
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
