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
  Reply,
  ReplyAll,
  Search,
  Send,
  AttachFile,
  OpenInFull,
  Remove,
  Close,
} from "@mui/icons-material";
import {
  alpha,
  Badge,
  Box,
  Button,
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Pagination,
} from "@mui/material";
import DOMPurify from "dompurify";
import { useNavigate, useParams } from "react-router-dom";
import { mailApi } from "../../entities/mail/api";
import type { MailFolder, MailRecipient, MailThreadListItem } from "../../entities/mail/types";
import {
  useMailThread,
  useMailThreadSearch,
  useMailThreads,
  useMailStats,
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
  const [composerMinimized, setComposerMinimized] = useState(false);
  const [composeSessionId, setComposeSessionId] = useState(0);
  const [composerDefaults, setComposerDefaults] = useState<{
    to?: string;
    cc?: string;
    subject?: string;
    body?: string;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const selectedFolder: MailFolder =
    folderParam && folderSet.has(folderParam as MailFolder) ? (folderParam as MailFolder) : "inbox";
  const selectedThreadId = messageIdParam ?? null;

  const debouncedSearch = useDebounce(searchTerm.trim(), 300);

  const { data: stats } = useMailStats();
  const { data: threadsData, isLoading } = useMailThreads({
    folder: selectedFolder,
    page,
    page_size: PAGE_SIZE,
  });

  const { data: searchData, isFetching: isSearchFetching } = useMailThreadSearch(
    { q: debouncedSearch, page, page_size: PAGE_SIZE },
    debouncedSearch.length > 1,
  );

  const { data: selectedThread } = useMailThread(selectedThreadId ?? "");
  const syncMessages = useSyncMailMessages();
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);

  const baseThreads = useMemo(() => threadsData?.items ?? [], [threadsData]);

  const threads = useMemo(() => {
    if (!debouncedSearch) {
      return baseThreads;
    }
    return searchData?.items ?? [];
  }, [baseThreads, debouncedSearch, searchData?.items]);

  const totalCount = debouncedSearch ? (searchData?.total ?? 0) : (threadsData?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openComposer = (defaults?: { to?: string; cc?: string; subject?: string; body?: string }) => {
    setComposerDefaults(defaults ?? {});
    setComposeSessionId((prev) => prev + 1);
    setComposerMinimized(false);
    setComposerOpen(true);
  };

  const minimizeComposer = () => {
    setComposerOpen(false);
    setComposerMinimized(true);
  };

  const restoreComposer = () => {
    setComposerMinimized(false);
    setComposerOpen(true);
  };

  const closeComposerDiscard = () => {
    setComposerOpen(false);
    setComposerMinimized(false);
    setComposerDefaults({});
  };

  const goToFolder = (folder: MailFolder) => {
    navigate(`/crm/mail/${folder}`);
    setPage(1);
  };

  const selectThread = (thread: MailThreadListItem) => {
    const threadId = thread.thread_id ?? thread.id;
    if (!threadId) return;
    navigate(`/crm/mail/${selectedFolder}/${threadId}`);
  };

  const orderedMessages = useMemo(() => {
    return [...(selectedThread?.messages ?? [])].sort(
      (a, b) => new Date(a.processed_at).getTime() - new Date(b.processed_at).getTime(),
    );
  }, [selectedThread?.messages]);

  const latestMessage = orderedMessages.at(-1);

  const openReplyComposer = (replyAll: boolean) => {
    if (!latestMessage) return;
    const safeRecipients = latestMessage.recipients ?? [];
    const toList = replyAll
      ? [latestMessage.sender_email, ...toRecipientEmailList(safeRecipients, "to")]
      : [latestMessage.sender_email];

    const uniqueTo = Array.from(new Set(toList.filter(Boolean))).join(", ");
    const cc = replyAll ? toRecipientEmailList(safeRecipients, "cc").join(", ") : "";

    openComposer({
      to: uniqueTo,
      cc,
      subject: getReplySubject(latestMessage.subject),
      body: `\n\n---\n${latestMessage.content?.body_text ?? ""}`,
    });
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
          openComposer();
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

        {!selectedThreadId ? (
          <Box sx={{ p: 1.25, overflow: "auto" }}>
            <OutlinedInput
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              fullWidth
              size="small"
              placeholder="Поиск тредов..."
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

            {(isLoading || isSearchFetching) && <Typography>Загрузка...</Typography>}
            {!isLoading && !isSearchFetching && threads.length === 0 && (
              <Typography color="text.secondary">Нет тредов в этой папке.</Typography>
            )}

            <List sx={{ display: "flex", flexDirection: "column", gap: 0.75, p: 0 }}>
              {threads.map((thread) => {
                return (
                  <Paper
                    key={thread.thread_id ?? thread.id}
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
                      borderColor: alpha(thread.unread_count > 0 ? "#2563EB" : "#8EA4CC", thread.unread_count > 0 ? 0.55 : 0.35),
                      backgroundColor: alpha("#FFFFFF", thread.unread_count > 0 ? 0.86 : 0.68),
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: `0 10px 24px ${alpha("#5D74A1", 0.16)}`,
                      },
                    }}
                    onClick={() => selectThread(thread)}
                  >
                    <Box sx={{ minWidth: 190, maxWidth: 220 }}>
                      <Typography variant="body2" sx={{ color: "#5A6885" }} noWrap>
                        {thread.sender_name || thread.sender_email || (thread.participants ?? []).join(", ") || "Участники неизвестны"}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: thread.unread_count > 0 ? 800 : 600, color: "#1C2B4D" }}
                      >
                        {thread.subject || "(без темы)"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.8} alignItems="center">
                      {thread.has_attachments && (
                        <Chip label="Файлы" size="small" sx={{ height: 20, borderRadius: 99 }} />
                      )}
                      {thread.message_count > 1 && (
                        <Chip
                          label={`${thread.message_count}`}
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectThread(thread);
                          }}
                          sx={{ height: 20, borderRadius: 99, cursor: "pointer" }}
                        />
                      )}
                      <Typography variant="caption" sx={{ color: "#607193", minWidth: 120 }}>
                        {new Date(thread.last_message_at).toLocaleString("ru-RU")}
                      </Typography>
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
                {selectedThread?.subject || "(без темы)"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Участники: {(selectedThread?.participants ?? []).join(", ") || "—"}
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

              <Stack spacing={1.25}>
                {orderedMessages.map((message, index) => {
                  const sanitizedHtmlBody = message.content?.body_html
                    ? DOMPurify.sanitize(message.content.body_html, { USE_PROFILES: { html: true } })
                    : null;
                  const isLastMessage = index === orderedMessages.length - 1;

                  return (
                    <Paper key={message.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {message.sender_name || message.sender_email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(message.processed_at).toLocaleString("ru-RU")}
                      </Typography>

                      {!!(message.attachments?.length ?? 0) && (
                        <Stack spacing={0.8} sx={{ my: 1 }}>
                          {(message.attachments ?? []).map((attachment) => (
                            <Stack key={attachment.id} direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                <AttachFile fontSize="small" />
                                <Typography variant="body2" noWrap>
                                  {attachment.filename}
                                </Typography>
                              </Stack>
                              <Button
                                size="small"
                                component="a"
                                href={mailApi.getDownloadAttachmentUrlForDownload(message.id, attachment.id)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Скачать
                              </Button>
                            </Stack>
                          ))}
                        </Stack>
                      )}

                      {(isLastMessage || message.content?.body_text || sanitizedHtmlBody) && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          {sanitizedHtmlBody ? (
                            <Box dangerouslySetInnerHTML={{ __html: sanitizedHtmlBody }} />
                          ) : message.content?.body_text ? (
                            <Typography sx={{ whiteSpace: "pre-line" }}>{message.content.body_text}</Typography>
                          ) : (
                            <Typography sx={{ whiteSpace: "pre-line" }}>Нет содержимого письма</Typography>
                          )}
                        </>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>

      {composerMinimized && (
        <Box
          sx={{
            position: "fixed",
            right: 24,
            bottom: 20,
            width: { xs: "calc(100% - 24px)", sm: 360 },
            maxWidth: "calc(100vw - 24px)",
            borderRadius: "14px",
            border: `1px solid ${alpha("#8EA8D8", 0.7)}`,
            boxShadow: `0 10px 24px ${alpha("#2A4D8F", 0.22)}`,
            background: "linear-gradient(120deg, rgba(255,255,255,0.96), rgba(244,248,255,0.92))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 0.75,
            zIndex: 1400,
            transition: "all .18s ease",
            "&:hover": {
              boxShadow: `0 14px 30px ${alpha("#2A4D8F", 0.28)}`,
              transform: "translateY(-1px)",
            },
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              bgcolor: alpha("#2563EB", 0.14),
              color: "#1746A2",
              borderRadius: 99,
              px: 1.25,
              py: 0.5,
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.2,
            }}
          >
            Черновик письма
          </Box>

          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Свернуто">
              <span>
                <IconButton size="small" disabled>
                  <Remove fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Развернуть">
              <IconButton size="small" onClick={restoreComposer}>
                <OpenInFull fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Закрыть">
              <IconButton size="small" onClick={closeComposerDiscard}>
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}

      <MailComposer
        open={composerOpen}
        composeSessionId={composeSessionId}
        onMinimize={minimizeComposer}
        onCloseDiscard={closeComposerDiscard}
        initialValues={composerDefaults}
      />
    </Box>
  );
}
