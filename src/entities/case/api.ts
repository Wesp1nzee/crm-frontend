import { api } from '../../shared/api/axios';
import type { 
  Case, 
  CaseCreateRequest,
  CasePatchRequest,
  GetCasesQuery,
  GetCasesResponse,
  CaseDetailResponse,
  CaseSuggestion
} from './types';

export const casesApi = {
  getCases: (params?: GetCasesQuery) => {
    // Очищаем пустые параметры
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    return api.get<GetCasesResponse>('/cases', { params: cleanParams });
  },
  
  getCase: (id: string) => 
    api.get<CaseDetailResponse>(`/cases/${id}`),
  
  createCase: (data: CaseCreateRequest) => 
    api.post<Case>('/cases', data),
  
  updateCase: (id: string, data: Partial<Case>) => 
    api.put<Case>(`/cases/${id}`, data),

  patchCase: (id: string, data: CasePatchRequest) => 
    api.patch<Case>(`/cases/${id}`, data),

  deleteCase: (caseId: string) => 
    api.delete(`/cases/${caseId}`),

  getSuggestions: (query: string) => 
    api.get<CaseSuggestion[]>('/cases/suggest', { params: { q: query } }).then(res => res.data),

  // Скачать все документы дела как ZIP
  downloadCaseDocuments: async (caseId: string): Promise<void> => {
    const response = await api.get(`/cases/${caseId}/download-documents`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `case_${caseId}_documents.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};