import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mailApi } from "../../entities/mail/api";
import type {
  MailBulkAction,
  MailFolder,
  MailMessagePatch,
  MailMessagesQuery,
  MailSearchQuery,
  MailSendPayload,
} from "../../entities/mail/types";

const mailQueryKeys = {
  messages: (params?: MailMessagesQuery) => ["mail", "messages", params] as const,
  search: (params: MailSearchQuery) => ["mail", "search", params] as const,
  message: (messageId: string) => ["mail", "message", messageId] as const,
  thread: (threadId: string) => ["mail", "thread", threadId] as const,
  stats: () => ["mail", "stats"] as const,
};

export const useMailMessages = (params?: MailMessagesQuery) =>
  useQuery({
    queryKey: mailQueryKeys.messages(params),
    queryFn: () => mailApi.getMessages(params).then((res) => res.data),
  });

export const useMailSearch = (params: MailSearchQuery, enabled = true) =>
  useQuery({
    queryKey: mailQueryKeys.search(params),
    queryFn: () => mailApi.searchMessages(params).then((res) => res.data),
    enabled,
  });

export const useMailMessage = (messageId: string) =>
  useQuery({
    queryKey: mailQueryKeys.message(messageId),
    queryFn: () => mailApi.getMessage(messageId).then((res) => res.data),
    enabled: Boolean(messageId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useMailThread = (threadId: string) =>
  useQuery({
    queryKey: mailQueryKeys.thread(threadId),
    queryFn: () => mailApi.getThread(threadId).then((res) => res.data),
    enabled: Boolean(threadId),
  });

export const useMailStats = () =>
  useQuery({
    queryKey: mailQueryKeys.stats(),
    queryFn: () => mailApi.getStats().then((res) => res.data),
  });

export const useSendMail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, files }: { payload: MailSendPayload; files?: File[] }) => {
      if (files && files.length > 0) {
        return mailApi.sendMessageWithAttachments(payload, files).then((res) => res.data);
      }
      return mailApi.sendMessage(payload).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail"] });
    },
  });
};

export const usePatchMailMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: MailMessagePatch }) =>
      mailApi.patchMessage(messageId, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mail", "messages"] });
      queryClient.invalidateQueries({ queryKey: ["mail", "search"] });
      queryClient.invalidateQueries({ queryKey: mailQueryKeys.stats() });
      queryClient.setQueryData(mailQueryKeys.message(variables.messageId), (current: unknown) =>
        current && typeof current === "object"
          ? { ...current, ...variables.payload }
          : current,
      );
    },
  });
};

export const useBulkMailAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageIds, action }: { messageIds: string[]; action: MailBulkAction }) =>
      mailApi
        .bulkAction({ message_ids: messageIds, action })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail"] });
    },
  });
};

export const useSyncMailFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folder: MailFolder) => mailApi.syncFolder(folder).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail"] });
    },
  });
};

export const useSyncMailMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysHistory?: number) =>
      mailApi
        .syncMessages(daysHistory ? { days_history: daysHistory } : undefined)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail"] });
    },
  });
};

// Temporary mock for UI block that expects realtime collaboration data.
export const useCollaborationStatus = (_threadId: string) =>
  useQuery({
    queryKey: ["mail", "collaboration", _threadId],
    queryFn: async () => [],
    staleTime: 30_000,
  });
