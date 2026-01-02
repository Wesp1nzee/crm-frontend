import { api } from '../../shared/api/axios';
import type { Expert, Assignment } from './types';

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