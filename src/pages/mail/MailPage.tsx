import { type MouseEvent, useMemo, useState } from "react";
import {
  Add,
  Archive,
  ArrowBack,
  Delete,
  Drafts,
  Inbox,
  MarkEmailRead,
  MarkEmailUnread,
  Menu,
  Refresh,
  Reply,
  ReplyAll,
  Search,
  Send,
  Star,
  AttachFile,
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
  Pagination,
} from "@mui/material";
import DOMPurify from "dompurify";
import { useNavigate, useParams } from "react-router-dom";
import { mailApi } from "../../entities/mail/api";
import type { MailFolder, MailMessageListItem, MailRecipient } from "../../entities/mail/types";
import {
  useBulkMailAction,
  useMailMessage,
  useMailMessages,
  useMailSearch,
  useMailStats,
  usePatchMailMessage,
  useSyncMailMessages,
} from "../../shared/hooks/useMail";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { MailComposer } from "./MailComposer";

const folderMeta: Array<{ id: MailFolder; label: string }> = [
  { id: "inbox", label: "Входящие" },
  { id: "sent", label: "Отправленные" },
  { id: "drafts", label: "Черновики" },
  { id: "spam", label: "Спам" },
  { id: "trash", label: "Корзина" },
  { id: "archive", label: "Архив" },
];

const folderSet = new Set<MailFolder>(folderMeta.map((folder) => folder.id));
const PAGE_SIZE = 20;

const folderIcon = (folder: MailFolder) => {
  if (folder === "inbox") return <Inbox fontSize="small" />;
  if (folder === "sent") return <Send fontSize="small" />;
  if (folder === "drafts") return <Drafts fontSize="small" />;
  if (folder === "spam") return <Delete fontSize="small" />;
  if (folder === "archive") return <Archive fontSize="small" />;
  return <Delete fontSize="small" />;
};

const glassSurface = {
  borderRadius: "20px",
  backdropFilter: "blur(16px)",
  background: `linear-gradient(140deg, ${alpha("#FFFFFF", 0.7)} 0%, ${alpha("#EFF4FF", 0.56)} 100%)`,
  border: `1px solid ${alpha("#A4B6DA", 0.38)}`,
  boxShadow: `0 16px 32px ${alpha("#5D74A1", 0.14)}`,
};

const getReplySubject = (subject?: string | null) => {
  if (!subject) return "Re:";
  return subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;
};

const toRecipientEmailList = (recipients: MailRecipient[], type: "to" | "cc") =>
  recipients.filter((recipient) => recipient.recipient_type === type).map((recipient) => recipient.email_address);

export function MailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { folder: folderParam, messageId: messageIdParam } = useParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDefaults, setComposerDefaults] = useState<{
    to?: string;
    cc?: string;
    subject?: string;
    body?: string;
  }>({});
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const selectedFolder: MailFolder =
    folderParam && folderSet.has(folderParam as MailFolder) ? (folderParam as MailFolder) : "inbox";
  const selectedMessageId = messageIdParam ?? null;

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const { data: stats } = useMailStats();
  const { data: messagesData, isLoading } = useMailMessages({
    folder: selectedFolder,
    is_read: showUnreadOnly ? false : undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const { data: searchData, isFetching: isSearchFetching } = useMailSearch(
    { q: debouncedSearch, page, page_size: PAGE_SIZE },
    debouncedSearch.length > 1,
  );

  const { data: selectedMessage } = useMailMessage(selectedMessageId ?? "");
  const patchMessage = usePatchMailMessage();
  const syncMessages = useSyncMailMessages();
  const bulkAction = useBulkMailAction();
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);

  const baseMessages = useMemo(() => messagesData?.items ?? [], [messagesData]);

  const messages = useMemo(() => {
    if (!debouncedSearch) {
      return baseMessages;
    }
    return (searchData?.items ?? []).filter((message) => message.folder === selectedFolder);
  }, [baseMessages, debouncedSearch, searchData?.items, selectedFolder]);

  const totalCount = debouncedSearch ? (searchData?.total ?? 0) : (messagesData?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const sanitizedHtmlBody = useMemo(() => {
    const rawHtml = selectedMessage?.content?.body_html;
    if (!rawHtml) return null;

    return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
  }, [selectedMessage?.content?.body_html]);

  const resetSelection = () => setSelectedIds([]);

  const goToFolder = (folder: MailFolder) => {
    navigate(`/crm/mail/${folder}`);
    resetSelection();
    setPage(1);
  };

  const selectMessage = async (message: MailMessageListItem) => {
    navigate(`/crm/mail/${selectedFolder}/${message.id}`);
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

  const openReplyComposer = (replyAll: boolean) => {
    if (!selectedMessage) return;
    const toList = replyAll
      ? [selectedMessage.sender_email, ...toRecipientEmailList(selectedMessage.recipients, "to")]
      : [selectedMessage.sender_email];

    const uniqueTo = Array.from(new Set(toList.filter(Boolean))).join(", ");
    const cc = replyAll ? toRecipientEmailList(selectedMessage.recipients, "cc").join(", ") : "";

    setComposerDefaults({
      to: uniqueTo,
      cc,
      subject: getReplySubject(selectedMessage.subject),
      body: `\n\n---\n${selectedMessage.content?.body_text ?? ""}`,
    });
    setComposerOpen(true);
  };

  const handleRefresh = async () => {
    const now = Date.now();
    if (now - lastSyncedAt < 30_000) {
      return;
    }
    await syncMessages.mutateAsync();
    setLastSyncedAt(now);
  };

  const isSyncBlocked = Date.now() - lastSyncedAt < 30_000;

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
          Почта / Входящие
        </Typography>
      </Box>

      <Button
        startIcon={<Add />}
        variant="contained"
        onClick={() => {
          setComposerDefaults({});
          setComposerOpen(true);
        }}
        sx={{
          borderRadius: 99,
          mx: 1,
          py: 1,
          boxShadow: `0 12px 24px ${alpha("#2563EB", 0.28)}`,
          background: "linear-gradient(120deg, #2563EB 0%, #3B82F6 100%)",
        }}
      >
        Написать
      </Button>

      <List sx={{ pt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {folderMeta.map((folder) => {
          const active = selectedFolder === folder.id;
          return (
            <ListItem key={folder.id} disablePadding sx={{ px: 0.5 }}>
              <Button
                fullWidth
                onClick={() => {
                  goToFolder(folder.id);
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
          onChange={(event) => {
            setShowUnreadOnly(event.target.checked);
            setPage(1);
          }}
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
        fontFamily: "Inter, Roboto, system-ui, sans-serif",
        height: "calc(100vh - 120px)",
        minHeight: 620,
        borderRadius: 6,
        p: 1.5,
        gap: 1.5,
        background: "linear-gradient(115deg, #EAF3FF 0%, #EDF1FF 48%, #F4EAF8 100%)",
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
          <IconButton
            onClick={handleRefresh}
            disabled={syncMessages.isPending || isSyncBlocked}
          >
            <Refresh />
          </IconButton>
        </Box>

        {!selectedMessageId ? (
          <Box sx={{ p: 1.25, overflow: "auto" }}>
            <OutlinedInput
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
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
                <Chip label={`${selectedIds.length} выбрано`} size="small" color="primary" />
                <Button size="small" onClick={() => void handleBulkAction("archive")}>Архив</Button>
                <Button size="small" onClick={() => void handleBulkAction("star")}>В избранное</Button>
                <Button size="small" onClick={() => void handleBulkAction("read")}>Прочитано</Button>
                <Button size="small" color="error" onClick={() => void handleBulkAction("delete")}>
                  Удалить
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

                    <Tooltip title={message.is_read ? "Пометить как непрочитанное" : "Пометить как прочитанное"}>
                      <IconButton
                        size="small"
                        onClick={(event) =>
                          void handleQuickAction(event, message.id, {
                            is_read: !message.is_read,
                          })
                        }
                        sx={{ p: 0.25 }}
                      >
                        <Box
                          sx={{
                            width: 11,
                            height: 11,
                            borderRadius: "50%",
                            border: `1px solid ${alpha("#2563EB", 0.55)}`,
                            backgroundColor: message.is_read ? "transparent" : "#2563EB",
                          }}
                        />
                      </IconButton>
                    </Tooltip>

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
                        <Chip label="Файлы" size="small" sx={{ height: 20, borderRadius: 99 }} />
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
                      <Tooltip title={message.is_read ? "Пометить непрочитанным" : "Пометить прочитанным"}>
                        <IconButton
                          size="small"
                          onClick={(event) =>
                            void handleQuickAction(event, message.id, {
                              is_read: !message.is_read,
                            })
                          }
                        >
                          {message.is_read ? <MarkEmailUnread fontSize="small" /> : <MarkEmailRead fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="В избранное">
                        <IconButton
                          size="small"
                          onClick={(event) =>
                            void handleQuickAction(event, message.id, { is_starred: !message.is_starred })
                          }
                        >
                          <Star fontSize="small" sx={{ color: message.is_starred ? "#2563EB" : undefined }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Архивировать">
                        <IconButton
                          size="small"
                          onClick={(event) => void handleQuickAction(event, message.id, { is_archived: true })}
                        >
                          <Archive fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="В корзину">
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

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
                <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2, overflow: "auto" }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(`/crm/mail/${selectedFolder}`)}>
              Назад к списку
            </Button>

            <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: "20px" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedMessage?.subject || "(без темы)"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                От: {selectedMessage?.sender_name || selectedMessage?.sender_email}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Reply />}
                  onClick={() => openReplyComposer(false)}
                >
                  Ответить
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ReplyAll />}
                  onClick={() => openReplyComposer(true)}
                >
                  Ответить всем
                </Button>
              </Stack>

              {!!selectedMessage?.attachments?.length && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Вложения ({selectedMessage.attachments.length})
                  </Typography>
                  <Stack spacing={0.8}>
                    {selectedMessage.attachments.map((attachment) => (
                      <Stack
                        key={attachment.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          px: 1.2,
                          py: 0.8,
                          borderRadius: 2,
                          border: `1px solid ${alpha("#9EB3DA", 0.45)}`,
                          backgroundColor: alpha("#ffffff", 0.7),
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                          <AttachFile fontSize="small" />
                          <Typography variant="body2" noWrap>
                            {attachment.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(attachment.file_size / 1024).toFixed(1)} KB
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          component="a"
                          href={mailApi.getDownloadAttachmentUrlForDownload(selectedMessage.id, attachment.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Скачать
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />
              {sanitizedHtmlBody ? (
                <Box
                  sx={{
                    "& a": {
                      color: theme.palette.primary.main,
                      textDecoration: "underline",
                      fontWeight: 500,
                    },
                    "& p": { my: 1 },
                    "& br": { lineHeight: 1.55 },
                    "& ol, & ul": { pl: 3, my: 1.25 },
                    "& li": { mb: 0.75 },
                    "& img": { maxWidth: "100%", height: "auto" },
                    "& table": { maxWidth: "100%", display: "block", overflowX: "auto" },
                    "& .gmail_chip": {
                      boxSizing: "border-box",
                      height: "auto !important",
                      maxHeight: "none !important",
                      minHeight: 40,
                      display: "flex !important",
                      alignItems: "center",
                      overflow: "hidden",
                    },
                    "& .gmail_chip a": {
                      display: "flex !important",
                      alignItems: "center",
                      minWidth: 0,
                      width: "100%",
                      maxWidth: "100% !important",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    },
                    "& .gmail_chip img": {
                      width: 20,
                      minWidth: 20,
                      height: 20,
                      objectFit: "contain",
                      verticalAlign: "middle !important",
                      flexShrink: 0,
                    },
                    "& .gmail_chip span": {
                      display: "inline-block",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle !important",
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedHtmlBody }}
                />
              ) : selectedMessage?.content?.body_text ? (
                <Typography sx={{ whiteSpace: "pre-line" }}>
                  {selectedMessage.content.body_text}
                </Typography>
              ) : (
                <Typography sx={{ whiteSpace: "pre-line" }}>
                  Нет содержимого письма
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      <MailComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        initialValues={composerDefaults}
      />
    </Box>
  );
}
