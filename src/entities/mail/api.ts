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
  MailThreadRead,
  OversizedMailBatch,
  OversizedMailPreviewUrl,
  PaginatedMailMessages,
} from "./types";

const getFrontendDomain = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
};

const buildMailFormData = (payload: MailSendPayload, files: File[]) => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  formData.append("frontend_domain", getFrontendDomain());
  files.forEach((file) => {
    formData.append("files", file);
  });
  return formData;
};

export const mailApi = {
  getMessages: (params?: MailMessagesQuery) =>
    api.get<PaginatedMailMessages>("/mail/messages", { params }),

  searchMessages: (params: MailSearchQuery) =>
    api.get<PaginatedMailMessages>("/mail/messages/search", { params }),

  getMessage: (messageId: string) =>
    api.get<MailMessageRead>(`/mail/messages/${messageId}`),

  sendMessage: (payload: MailSendPayload) =>
    api.post<MailSendResult>("/mail/messages", payload),

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
    api.post<MailSendResult>(`/mail/messages/${messageId}/reply`, payload, {
      params: { reply_all: replyAll },
    }),

  forwardMessage: (messageId: string, payload: MailSendPayload) =>
    api.post<MailSendResult>(`/mail/messages/${messageId}/forward`, payload),

  createDraft: (payload: MailSendPayload) =>
    api.post<MailMessageRead>("/mail/drafts", payload),

  updateDraft: (messageId: string, payload: MailSendPayload) =>
    api.patch<MailMessageRead>(`/mail/drafts/${messageId}`, payload),

  sendDraft: (messageId: string) =>
    api.post<MailSendResult>(`/mail/drafts/${messageId}/send`),

  getThread: (threadId: string) => api.get<MailThreadRead>(`/mail/threads/${threadId}`),

  getAttachments: (messageId: string) =>
    api.get<MailAttachment[]>(`/mail/messages/${messageId}/attachments`),

  getDownloadAttachmentUrl: (messageId: string, attachmentId: string) =>
    `/api/mail/messages/${messageId}/attachments/${attachmentId}/download`,

  getDownloadAttachmentUrlForDownload: (messageId: string, attachmentId: string) =>
    `/api/mail/messages/${messageId}/attachments/${attachmentId}/download?download=true`,

  syncAllFolders: () => api.post<MailSyncResult[]>("/mail/sync"),

  syncFolder: (folder: MailFolder) => api.post<MailSyncResult>(`/mail/sync/${folder}`),

  syncMessages: (payload?: MailMessagesSyncPayload) =>
    api.post<MailSyncResult>("/mail/messages/sync", payload),

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
};
