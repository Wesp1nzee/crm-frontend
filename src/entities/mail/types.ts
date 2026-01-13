export interface Mail {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: MailAttachment[];
  receivedAt: string;
  sentAt?: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface MailThread {
  id: string;
  subject: string;
  participants: string[];
  mails: Mail[];
  lastActivity: string;
  isRead: boolean;
}

export interface MailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface MailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'custom';
  unreadCount: number;
}

export interface MailDraft {
  id?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments: MailAttachment[];
}