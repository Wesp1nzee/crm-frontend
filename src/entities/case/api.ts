import { api } from "../../shared/api/axios";
import type {
  Case,
  CaseCreateRequest,
  CasePatchRequest,
  GetCasesQuery,
  GetCasesResponse,
  CaseDetailResponse,
  CaseSuggestion,
  CaseExpertsUpdateRequest,
} from "./types";

export const casesApi = {
  getCases: (params?: GetCasesQuery) => {
    console.log('getCases called with params:', params);
    
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([_key, value]) => 
          value !== undefined && 
          value !== null && 
          value !== "" && 
          !(Array.isArray(value) && value.length === 0),
      ),
    );
    
    console.log('After cleanup:', cleanParams);
    
    const serializedParams: Record<string, string | number | boolean> = {};
    Object.entries(cleanParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        serializedParams[key] = value.join(',');
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        serializedParams[key] = value;
      }
    });
    
    console.log('Serialized params:', serializedParams);
    
    return api.get<GetCasesResponse>("/cases", { params: serializedParams });
  },

  getCase: (id: string) => api.get<CaseDetailResponse>(`/cases/${id}`),

  createCase: (data: CaseCreateRequest) => api.post<Case>("/cases", data),

  updateCase: (id: string, data: Partial<Case>) =>
    api.put<Case>(`/cases/${id}`, data),

  patchCase: (id: string, data: CasePatchRequest) =>
    api.patch<Case>(`/cases/${id}`, data),

  updateCaseExperts: (id: string, data: CaseExpertsUpdateRequest) =>
    api.put<Case>(`/cases/${id}/experts`, data),

  deleteCase: (caseId: string) => api.delete(`/cases/${caseId}`),

  getSuggestions: (query: string) =>
    api
      .get<CaseSuggestion[]>("/cases/suggest", { params: { q: query } })
      .then((res) => res.data),

  downloadCaseDocuments: async (
    caseId: string,
    onDownloadProgress?: (progress: number) => void,
  ): Promise<void> => {
    const response = await api.get(`/cases/${caseId}/download-documents`, {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (!onDownloadProgress || !progressEvent.total) return;
        const progress = Math.min(
          100,
          Math.round((progressEvent.loaded * 100) / progressEvent.total),
        );
        onDownloadProgress(progress);
      },
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `case_${caseId}_documents.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportCasesToExcel: async (params?: GetCasesQuery): Promise<void> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(
        ([_key, value]) =>
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0),
      ),
    );

    const serializedParams: Record<string, string | number | boolean> = {};
    Object.entries(cleanParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        serializedParams[key] = value.join(',');
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        serializedParams[key] = value;
      }
    });

    const response = await api.get("/cases/export/excel", {
      params: serializedParams,
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let filename = "cases_export.xlsx";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
