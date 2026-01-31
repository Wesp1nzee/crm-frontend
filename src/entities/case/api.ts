// src/entities/case/api.ts
import { api } from '../../shared/api/axios';
import type { 
  Case, 
  Client, 
  Document, 
  Invoice, 
  Payment,
  GetCasesQuery,
  GetCasesResponse 
} from './types';
import type { Expert, Assignment } from '../expert/types';

export const casesApi = {
  getCases: (params?: GetCasesQuery) => 
    api.get<GetCasesResponse>('/cases', { params }),
  
  getCase: (id: string) => 
    api.get<Case>(`/cases/${id}`),
  
  createCase: (data: Omit<Case, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Case>('/cases', data),
  
  updateCase: (id: string, data: Partial<Case>) => 
    api.put<Case>(`/cases/${id}`, data),

  deleteCase: (caseId: string) => 
    api.delete(`/cases/${caseId}`),
};

// Остальные API функции остаются без изменений
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

export const expertsApi = {
  getExperts: () => api.get<Expert[]>('/experts'),
  getExpert: (id: string) => api.get<Expert>(`/experts/${id}`),
  createExpert: (data: Omit<Expert, 'id' | 'createdAt' | 'workload'>) => api.post<Expert>('/experts', data),
  updateExpert: (id: string, data: Partial<Expert>) => api.put<Expert>(`/experts/${id}`, data),
  deleteExpert: (id: string) => api.delete(`/experts/${id}`),
};

export const assignmentsApi = {
  assignCase: (data: Omit<Assignment, 'id' | 'assignedAt'>) => api.post<Assignment>('/assignments', data),
  unassignCase: (caseId: string) => api.delete(`/assignments/case/${caseId}`),
  getAssignments: () => api.get<Assignment[]>('/assignments'),
};