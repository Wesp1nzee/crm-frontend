export type MailFolder = "inbox" | "sent" | "drafts" | "spam" | "trash" | "archive";

export type MailStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "error"
  | "failed";

export type MailMessageType = "incoming" | "outgoing" | "system_notification";

export type MailRecipientType = "to" | "cc" | "bcc";

export interface MailRecipient {
  id: string;
  email_address: string;
  recipient_type: MailRecipientType;
  name: string | null;
}

export interface MailAttachmentShort {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  attachment_id: string;
}

export interface MailMessageListItem {
  id: string;
  external_message_id: string | null;
  thread_id: string | null;
  parent_id: string | null;
  user_id: string;
  case_id: string | null;
  sender_email: string;
  sender_name: string | null;
  reply_to: string | null;
  subject: string | null;
  folder: MailFolder;
  message_type: MailMessageType;
  status: MailStatus;
  is_read: boolean;
  is_important: boolean;
  is_starred: boolean;
  is_spam: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  size_bytes: number | null;
  imap_uid: number | null;
  sent_at: string | null;
  processed_at: string;
  updated_at: string;
  attachment_count: number;
  has_attachments: boolean;
  recipients: MailRecipient[];
}

export interface MailContent {
  message_id: string;
  body_text: string | null;
  body_html: string | null;
  html_body?: string | null;
}

export interface MailMessageRead extends MailMessageListItem {
  content: MailContent | null;
  attachments: MailAttachmentShort[];
}

export interface PaginatedMailMessages {
  items: MailMessageListItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface MailThreadListItem {
  type?: "thread" | "message";
  thread_id?: string;
  id?: string;
  message_id?: string;
  subject: string | null;
  message_count?: number;
  unread_count: number;
  is_read?: boolean;
  last_message_at: string;
  participants?: string[];
  sender_name?: string | null;
  sender_email?: string | null;
  snippet?: string | null;
  is_starred?: boolean;
  is_important?: boolean;
  has_attachments?: boolean;
}

export interface PaginatedMailThreads {
  items: MailThreadListItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface PaginatedMailThread {
  meta: MailThreadListItem;
  items: MailMessageRead[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface MailSendPayload {
  case_id?: string;
  sender_email: string;
  sender_name?: string;
  subject?: string;
  frontend_domain?: string;
  recipients: Array<{
    email_address: string;
    recipient_type: MailRecipientType;
    name?: string;
  }>;
  content: {
    body_text?: string;
    body_html?: string;
    html_body?: string;
  };
}

export interface MailSendResult {
  message_id: string | null;
  status: MailStatus;
  external_message_id: string | null;
  sent_at: string | null;
  error: string | null;
  error_code?: string | null;
  rejected_files?: string[];
  message_saved?: boolean;
}

export interface MailMessagePatch {
  is_read?: boolean;
  is_starred?: boolean;
  is_important?: boolean;
  is_spam?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
  case_id?: string | null;
  folder?: MailFolder;
}

export type MailBulkAction =
  | "read"
  | "unread"
  | "star"
  | "unstar"
  | "archive"
  | "unarchive"
  | "delete"
  | "restore"
  | "spam"
  | "not_spam";

export interface MailBulkPayload {
  message_ids: string[];
  action: MailBulkAction;
}

export interface MailBulkResult {
  updated: number;
  failed: string[];
}

export interface MailThreadRead {
  thread_id?: string;
  id?: string;
  subject: string | null;
  message_count: number;
  unread_count: number;
  last_message_at: string;
  participants?: string[];
  messages: MailMessageRead[];
}

export interface MailPaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MailThreadsApiResponse {
  items: MailThreadListItem[];
  meta?: MailPaginationMeta;
  total?: number;
  page?: number;
  page_size?: number;
  has_next?: boolean;
}

export interface MailAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  file_size: number;
  stored_path: string;
  attachment_id: string;
  created_at: string;
}

export interface MailSyncResult {
  folder: string;
  fetched: number;
  skipped: number;
  errors: number;
  synced_at: string;
}

export type MailStats = Record<MailFolder, number>;

export interface MailMessagesQuery {
  folder?: MailFolder;
  is_read?: boolean;
  is_starred?: boolean;
  is_important?: boolean;
  is_spam?: boolean;
  is_archived?: boolean;
  case_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface MailSearchQuery {
  q: string;
  page?: number;
  page_size?: number;
}

export interface MailMessagesSyncPayload {
  folder?: MailFolder;
  days_history?: number;
}

export interface OversizedMailFile {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
}

export interface OversizedMailBatch {
  id: string;
  share_token: string;
  created_at: string;
  files: OversizedMailFile[];
}

export interface OversizedMailPreviewUrl {
  file_id: string;
  filename: string;
  url: string;
  expires_in: number;
}

export interface MailAttachmentType {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  created_at: string;
  thread_id: string;
  message_subject: string | null;
  message_sender_email: string;
  message_sender_name: string | null;
  message_type: "incoming" | "outgoing";
  folder: MailFolder;
}

export interface MailAttachmentsListParams {
  mail_attachment_type?: "all" | "incoming" | "outgoing";
  search?: string;
  sort_by?: "filename" | "created_at" | "file_size";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface MailAttachmentsResponse {
  items: MailAttachmentType[];
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface LinkMailToCaseRequest {
  case_id: string;
}

export interface LinkMailToCaseResponse {
  message_id: string;
  case_id: string;
  success: boolean;
}

export interface UnlinkMailFromCaseResponse {
  success: boolean;
  message: string;
}

export interface PaginatedMailMessagesForCase {
  items: MailMessageListItem[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

// Legacy UI types used by mock mail screens (to be removed after full UI migration).
export interface Mail {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  receivedAt: string;
  sentAt?: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: "low" | "normal" | "high";
}

export interface MailThreadLegacy {
  id: string;
  subject: string;
  participants: string[];
  mails: Mail[];
  lastActivity: string;
  isRead: boolean;
  relatedCaseId?: string;
  relatedClientId?: string;
}

export type MailThread = MailThreadLegacy | MailThreadRead;
