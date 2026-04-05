import { api } from "../../shared/api/axios";
import type {
  MailAttachment,
  MailBulkPayload,
  MailBulkResult,
  MailFolder,
  MailMessagePatch,
  MailMessageRead,
  MailMessagesQuery,
  MailMessagesSyncPayload,
  MailSearchQuery,
  MailSendPayload,
  MailSendResult,
  MailStats,
  MailSyncResult,
  MailThreadsApiResponse,
  MailThreadRead,
  MailThreadListItem,
  OversizedMailBatch,
  OversizedMailPreviewUrl,
  PaginatedMailThread,
  PaginatedMailThreads,
  PaginatedMailMessages,
  MailAttachmentsListParams,
  MailAttachmentsResponse,
  LinkMailToCaseRequest,
  LinkMailToCaseResponse,
  UnlinkMailFromCaseResponse,
  PaginatedMailMessagesForCase,
  MailContactAutocompleteResponse,
} from "./types";

const getFrontendDomain = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
};

const withFrontendDomain = (payload: MailSendPayload): MailSendPayload => ({
  ...payload,
  frontend_domain: payload.frontend_domain ?? getFrontendDomain(),
});

const buildMailFormData = (payload: MailSendPayload, files: File[]) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(withFrontendDomain(payload)));
  files.forEach((file) => {
    formData.append("files", file);
  });
  return formData;
};

const normalizeThreadItem = (item: Record<string, unknown>) => {
  const senderName = typeof item.sender_name === "string" ? item.sender_name : null;
  const senderEmail = typeof item.sender_email === "string" ? item.sender_email : null;
  const participants = Array.isArray(item.participants)
    ? (item.participants as string[])
    : [senderName || senderEmail].filter(Boolean);

  return {
    ...item,
    type:
      item.type === "thread" || item.type === "message"
        ? (item.type as "thread" | "message")
        : (typeof item.message_count === "number" && item.message_count > 1 ? "thread" as const : "message" as const),
    thread_id:
      (typeof item.thread_id === "string" ? item.thread_id : null) ??
      (typeof item.id === "string" ? item.id : ""),
    message_id: typeof item.message_id === "string" ? item.message_id : undefined,
    message_count:
      typeof item.message_count === "number" ? item.message_count : 1,
    unread_count: typeof item.unread_count === "number" ? item.unread_count : 0,
    is_read:
      typeof item.is_read === "boolean"
        ? item.is_read
        : !(typeof item.unread_count === "number" && item.unread_count > 0),
    is_starred: typeof item.is_starred === "boolean" ? item.is_starred : false,
    is_important: typeof item.is_important === "boolean" ? item.is_important : false,
    participants,
    sender_name: senderName,
    sender_email: senderEmail,
    subject: typeof item.subject === "string" ? item.subject : null,
    last_message_at: typeof item.last_message_at === "string" ? item.last_message_at : new Date().toISOString(),
  };
};

const normalizeThreadsResponse = (raw: MailThreadsApiResponse): PaginatedMailThreads => {
  const items = (raw.items ?? []).map((item) => normalizeThreadItem(item as unknown as Record<string, unknown>)) as unknown as MailThreadListItem[];

  if (raw.meta) {
    return {
      items,
      total: raw.meta.total_items,
      page: raw.meta.current_page,
      page_size: raw.meta.per_page,
      has_next: raw.meta.has_next,
    };
  }

  return {
    items,
    total: raw.total ?? items.length,
    page: raw.page ?? 1,
    page_size: raw.page_size ?? items.length,
    has_next: raw.has_next ?? false,
  };
};

const normalizeThreadRead = (raw: MailThreadRead): MailThreadRead => ({
  ...raw,
  thread_id: raw.thread_id ?? raw.id ?? "",
  participants:
    raw.participants ??
    Array.from(
      new Set(
        (raw.messages ?? [])
          .flatMap((message) => [message.sender_name, message.sender_email])
          .filter(Boolean) as string[],
      ),
    ),
});

export const mailApi = {
  getMessages: (params?: MailMessagesQuery) =>
    api.get<PaginatedMailMessages>("/mail/messages", { params }),

  searchMessages: (params: MailSearchQuery) =>
    api.get<PaginatedMailMessages>("/mail/messages/search", { params }),

  getMessage: (messageId: string) =>
    api.get<MailMessageRead>(`/mail/messages/${messageId}`),

  sendMessage: (payload: MailSendPayload) =>
    api.post<MailSendResult>("/mail/messages", withFrontendDomain(payload)),

  sendMessageWithAttachments: (payload: MailSendPayload, files: File[]) =>
    api.post<MailSendResult>(
      "/mail/messages/with-attachments",
      buildMailFormData(payload, files),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),

  patchMessage: (messageId: string, payload: MailMessagePatch) =>
    api.patch<MailMessageRead>(`/mail/messages/${messageId}`, payload),

  deleteMessage: (messageId: string, permanent = false) =>
    api.delete<void>(`/mail/messages/${messageId}`, {
      params: { permanent },
    }),

  bulkAction: (payload: MailBulkPayload) =>
    api.post<MailBulkResult>("/mail/messages/bulk", payload),

  moveMessage: (messageId: string, folder: MailFolder) =>
    api.post<MailMessageRead>(`/mail/messages/${messageId}/move`, null, {
      params: { folder },
    }),

  replyToMessage: (
    messageId: string,
    payload: MailSendPayload,
    replyAll = false,
  ) =>
    api.post<MailSendResult>(`/mail/messages/${messageId}/reply`, withFrontendDomain(payload), {
      params: { reply_all: replyAll },
    }),

  forwardMessage: (messageId: string, payload: MailSendPayload) =>
    api.post<MailSendResult>(`/mail/messages/${messageId}/forward`, withFrontendDomain(payload)),

  createDraft: (payload: MailSendPayload) =>
    api.post<MailMessageRead>("/mail/drafts", withFrontendDomain(payload)),

  updateDraft: (messageId: string, payload: MailSendPayload) =>
    api.patch<MailMessageRead>(`/mail/drafts/${messageId}`, withFrontendDomain(payload)),

  sendDraft: (messageId: string) =>
    api.post<MailSendResult>(`/mail/drafts/${messageId}/send`),

  getThread: (threadId: string) =>
    api.get<MailThreadRead>(`/mail/threads/${threadId}`).then((response) => ({
      ...response,
      data: normalizeThreadRead(response.data),
    })),

  getThreads: (params?: {
    folder?: MailFolder;
    page?: number;
    page_size?: number;
    is_read?: boolean;
    is_starred?: boolean;
    is_important?: boolean;
  }) =>
    api.get<MailThreadsApiResponse>("/mail/threads", { params }).then((response) => ({
      ...response,
      data: normalizeThreadsResponse(response.data),
    })),

  searchThreads: (params: {
    q: string;
    page?: number;
    page_size?: number;
    is_read?: boolean;
    is_starred?: boolean;
    is_important?: boolean;
  }) => {
    const { q, ...rest } = params;
    return api.get<MailThreadsApiResponse>("/mail/threads", {
      params: { search: q, ...rest },
    }).then((response) => ({
      ...response,
      data: normalizeThreadsResponse(response.data),
    }));
  },

  getThreadMessages: (threadId: string, params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedMailThread>(`/mail/threads/${threadId}/messages`, { params }),

  getAttachments: (messageId: string) =>
    api.get<MailAttachment[]>(`/mail/messages/${messageId}/attachments`),

  getAttachmentsList: (params?: MailAttachmentsListParams) =>
    api.get<MailAttachmentsResponse>("/mail/attachments", { params }),

  getDownloadAttachmentUrl: (messageId: string, attachmentId: string) =>
    `/api/mail/messages/${messageId}/attachments/${attachmentId}/download`,

  getDownloadAttachmentUrlForDownload: (messageId: string, attachmentId: string) =>
    `/api/mail/messages/${messageId}/attachments/${attachmentId}/download?download=true`,

  syncAllFolders: () => api.post<MailSyncResult[]>("/mail/sync"),

  syncFolder: (folder: MailFolder) => api.post<MailSyncResult>(`/mail/sync/${folder}`),

  syncMessages: (payload?: MailMessagesSyncPayload) =>
    api.post<MailSyncResult>("/mail/sync", null, {
      params: {
        folder: payload?.folder,
        days_history: payload?.days_history,
      },
    }),

  getStats: () => api.get<MailStats>("/mail/stats"),

  getOversizedBatch: (token: string) =>
    api.get<OversizedMailBatch>(`/mail/oversized/${token}`, {
      withCredentials: false,
    }),

  getOversizedPreviewUrl: (token: string, fileId: string) =>
    api.get<OversizedMailPreviewUrl>(`/mail/oversized/${token}/${fileId}/preview-url`, {
      withCredentials: false,
    }),

  getOversizedDownloadUrl: (token: string, fileId: string) =>
    `/api/mail/oversized/${token}/${fileId}/download`,

  getOversizedZipUrl: (token: string) => `/api/mail/oversized/${token}/zip`,

  // NOTE: Download a single file with progress tracking.
  // Returns the blob and response headers. `onProgress` receives 0-100.
  downloadOversizedFile: (
    token: string,
    fileId: string,
    onProgress?: (pct: number) => void,
    signal?: AbortSignal,
    password?: string,
  ) =>
    api.get(`/mail/oversized/${token}/${fileId}/download`, {
      withCredentials: false,
      responseType: "blob",
      signal,
      headers: password ? { Authorization: `Bearer ${password}` } : undefined,
      onDownloadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),

  // NOTE: GET /mail/oversized/{token}/download-all returns JSON array of
  // { file_id, filename, url } where `url` is a presigned download URL.
  // The frontend then fetches each URL in parallel.
  getOversizedDownloadAll: (token: string, password?: string) =>
    api.get<
      Array<{ file_id: string; filename: string; url: string; content_type: string; file_size: number }>
    >(`/mail/oversized/${token}/download-all`, {
      withCredentials: false,
      headers: password ? { Authorization: `Bearer ${password}` } : undefined,
    }),

  // NOTE: Download ZIP archive with progress tracking.
  downloadOversizedZip: (
    token: string,
    onProgress?: (pct: number) => void,
    signal?: AbortSignal,
    password?: string,
  ) =>
    api.get(`/mail/oversized/${token}/zip`, {
      withCredentials: false,
      responseType: "blob",
      signal,
      headers: password ? { Authorization: `Bearer ${password}` } : undefined,
      onDownloadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),

  linkMailToCase: (messageId: string, payload: LinkMailToCaseRequest) =>
    api.post<LinkMailToCaseResponse>(`/mail/messages/${messageId}/link-to-case`, null, {
      params: { case_id: payload.case_id },
    }),

  unlinkMailFromCase: (messageId: string) =>
    api.post<UnlinkMailFromCaseResponse>(`/mail/messages/${messageId}/unlink-from-case`, {}),

  getCaseMessages: (caseId: string, params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedMailMessagesForCase>(`/mail/cases/${caseId}/messages`, { params }),

  getContactsAutocomplete: (query: string, limit = 5) =>
    api.get<MailContactAutocompleteResponse>("/mail/contacts/autocomplete", {
      params: { q: query, limit },
    }),
};
