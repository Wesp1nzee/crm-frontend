import { api } from '../../shared/api/axios';
import type { Case, Client, Document, Invoice, Payment } from './types';

export const casesApi = {
  getCases: () => api.get<Case[]>('/cases'),
  getCase: (id: string) => api.get<Case>(`/cases/${id}`),
  createCase: (data: Omit<Case, 'id' | 'createdAt'>) => api.post<Case>('/cases', data),
  updateCase: (id: string, data: Partial<Case>) => api.put<Case>(`/cases/${id}`, data),
};

export const clientsApi = {
  getClients: () => api.get<Client[]>('/clients'),
};

export const documentsApi = {
  getDocuments: () => api.get<Document[]>('/documents'),
  uploadDocument: (formData: FormData) => api.post<Document>('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
};

export const invoicesApi = {
  getInvoices: () => api.get<Invoice[]>('/invoices'),
  createInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) => api.post<Invoice>('/invoices', data),
  updateInvoice: (id: string, data: Partial<Invoice>) => api.put<Invoice>(`/invoices/${id}`, data),
};

export const paymentsApi = {
  getPayments: () => api.get<Payment[]>('/payments'),
  createPayment: (data: Omit<Payment, 'id'>) => api.post<Payment>('/payments', data),
};