import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mailApi } from "../../entities/mail/api";
import type {
  MailBulkAction,
  MailFolder,
  MailMessagePatch,
  MailMessagesQuery,
  MailSearchQuery,
  MailSendPayload,
  LinkMailToCaseRequest,
  MailContactAutocompleteResponse,
} from "../../entities/mail/types";

const mailQueryKeys = {
  threads: (params?: MailMessagesQuery) => ["mail", "threads", params] as const,
  threadSearch: (params: MailSearchQuery) => ["mail", "threads", "search", params] as const,
  message: (messageId: string) => ["mail", "message", messageId] as const,
  thread: (threadId: string) => ["mail", "thread", threadId] as const,
  stats: () => ["mail", "stats"] as const,
};

export const useMailThreads = (params?: MailMessagesQuery) =>
  useQuery({
    queryKey: mailQueryKeys.threads(params),
    queryFn: () => mailApi.getThreads(params).then((res) => res.data),
  });

export const useMailThreadSearch = (params: MailSearchQuery, enabled = true) =>
  useQuery({
    queryKey: mailQueryKeys.threadSearch(params),
    queryFn: () => mailApi.searchThreads(params).then((res) => res.data),
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
      queryClient.invalidateQueries({ queryKey: ["mail", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["mail", "threads", "search"] });
      queryClient.invalidateQueries({ queryKey: ["mail", "thread"] });
      queryClient.invalidateQueries({ queryKey: mailQueryKeys.stats() });
      queryClient.setQueriesData(
        { queryKey: ["mail", "thread"] },
        (current: unknown) => {
          if (!current || typeof current !== "object" || !("messages" in current)) {
            return current;
          }

          const thread = current as { messages?: Array<Record<string, unknown>> };
          if (!Array.isArray(thread.messages)) {
            return current;
          }

          return {
            ...thread,
            messages: thread.messages.map((message) =>
              message.id === variables.messageId
                ? { ...message, ...variables.payload }
                : message,
            ),
          };
        },
      );
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
    mutationFn: ({ folder, daysHistory }: { folder: MailFolder; daysHistory?: number }) =>
      mailApi
        .syncMessages({ folder, days_history: daysHistory })
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

export const useLinkMailToCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: LinkMailToCaseRequest }) =>
      mailApi.linkMailToCase(messageId, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mail", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["mail", "message", variables.messageId] });
      queryClient.invalidateQueries({ queryKey: ["cases", variables.payload.case_id] });
      queryClient.invalidateQueries({ queryKey: ["mail", "cases", variables.payload.case_id] });
    },
  });
};

export const useUnlinkMailFromCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      mailApi.unlinkMailFromCase(messageId).then((res) => res.data),
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries({ queryKey: ["mail", "threads"] });
      queryClient.invalidateQueries({ queryKey: ["mail", "message", messageId] });
      queryClient.invalidateQueries({ queryKey: ["mail", "cases"] });
    },
  });
};

export const useCaseMessages = (caseId: string, params?: { page?: number; page_size?: number }) =>
  useQuery({
    queryKey: ["mail", "cases", caseId, params],
    queryFn: () => mailApi.getCaseMessages(caseId, params).then((res) => res.data),
    enabled: Boolean(caseId),
  });

export const useMailContactsAutocomplete = (query: string, enabled = true) =>
  useQuery<MailContactAutocompleteResponse>({
    queryKey: ["mail", "contacts", "autocomplete", query],
    queryFn: () => mailApi.getContactsAutocomplete(query).then((res) => res.data),
    enabled: enabled && query.length > 0,
    staleTime: 30_000,
  });
