import { api } from '../../shared/api/axios';
import type {
  FileSystemEntry,
  FolderCreate,
  FolderResponse,
  DocumentResponse,
  DocumentDownloadUrl,
  DocumentsListParams,
  DocumentUploadData,
  AssetUpdateRequest,
} from './types';

export const documentsApi = {
  // Получить список файлов и папок
  getDocuments: async (params?: DocumentsListParams): Promise<FileSystemEntry[]> => {
    const { data } = await api.get('/documents', { params });
    return data;
  },

  // Создать папку
  createFolder: async (folderData: FolderCreate): Promise<FolderResponse> => {
    const { data } = await api.post('/documents/folders', folderData);
    return data;
  },

  // Загрузить документ
  uploadDocument: async (uploadData: DocumentUploadData): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    
    if (uploadData.case_id) {
      formData.append('case_id', uploadData.case_id);
    }
    if (uploadData.folder_id) {
      formData.append('folder_id', uploadData.folder_id);
    }
    if (uploadData.title) {
      formData.append('title', uploadData.title);
    }

    const { data } = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Получить ссылку на скачивание
  getDownloadUrl: async (documentId: string): Promise<DocumentDownloadUrl> => {
    const { data } = await api.get(`/documents/${documentId}/url?download=true`);
    return data;
  },

  // Получить ссылку для просмотра
  getPreviewUrl: async (documentId: string): Promise<DocumentDownloadUrl> => {
    const { data } = await api.get(`/documents/${documentId}/url?download=false`);
    return data;
  },

  // Удалить документ
  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  // Удалить папку
  deleteFolder: async (folderId: string): Promise<void> => {
    await api.delete(`/documents/folders/${folderId}`);
  },

  // Скачать папку как ZIP
  downloadFolder: async (folderId: string): Promise<void> => {
    const response = await api.get(`/documents/folders/${folderId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `folder_${folderId}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Обновить файл или папку
  updateAsset: async (updateData: AssetUpdateRequest): Promise<DocumentResponse | FolderResponse> => {
    const { data } = await api.patch('/documents/update', updateData);
    return data;
  },
};