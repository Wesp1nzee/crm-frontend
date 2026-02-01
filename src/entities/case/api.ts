import { api } from '../../shared/api/axios';
import type { 
  Case, 
  CaseCreateRequest,
  GetCasesQuery,
  GetCasesResponse 
} from './types';

export const casesApi = {
  getCases: (params?: GetCasesQuery) => 
    api.get<GetCasesResponse>('/cases', { params }),
  
  getCase: (id: string) => 
    api.get<Case>(`/cases/${id}`),
  
  createCase: (data: CaseCreateRequest) => 
    api.post<Case>('/cases', data),
  
  updateCase: (id: string, data: Partial<Case>) => 
    api.put<Case>(`/cases/${id}`, data),

  deleteCase: (caseId: string) => 
    api.delete(`/cases/${caseId}`),
};