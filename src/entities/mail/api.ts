import { api } from '../../shared/api/axios';
import type { Mail, MailThread, MailFolder, MailDraft } from './types';

export const mailApi = {
  // Folders
  getFolders: () => api.get<MailFolder[]>('/mail/folders'),
  
  // Threads
  getThreads: (folderId?: string) => 
    api.get<MailThread[]>('/mail/threads', { params: { folderId } }),
  getThread: (id: string) => api.get<MailThread>(`/mail/threads/${id}`),
  
  // Mails
  getMail: (id: string) => api.get<Mail>(`/mail/${id}`),
  sendMail: (draft: MailDraft) => api.post<Mail>('/mail/send', draft),
  saveDraft: (draft: MailDraft) => api.post<Mail>('/mail/drafts', draft),
  
  // Actions
  markAsRead: (ids: string[]) => api.patch('/mail/mark-read', { ids }),
  markAsUnread: (ids: string[]) => api.patch('/mail/mark-unread', { ids }),
  archive: (ids: string[]) => api.patch('/mail/archive', { ids }),
  star: (ids: string[]) => api.patch('/mail/star', { ids }),
  delete: (ids: string[]) => api.delete('/mail', { data: { ids } }),
};