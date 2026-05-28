import { api } from "../../shared/api/axios";
import type {
  FileSystemEntry,
  FolderCreate,
  FolderResponse,
  DocumentResponse,
  DocumentDownloadUrl,
  DocumentsListParams,
  PaginatedResponse,
  DocumentUploadData,
  AssetUpdateRequest,
  DocumentDownloadRequest,
  FolderDownloadRequest,
  BulkAssetsDownloadRequest,
  BulkAssetsRequest,
  DocumentsBulkMoveRequest,
} from "./types";

export const documentsApi = {
  // Получить список файлов и папок
  getDocuments: async (
    params?: DocumentsListParams,
  ): Promise<PaginatedResponse<FileSystemEntry>> => {
    const { data } = await api.get("/documents", { params });
    return data;
  },

  // Создать папку
  createFolder: async (folderData: FolderCreate): Promise<FolderResponse> => {
    const { data } = await api.post("/documents/folders", folderData);
    return data;
  },

  // Загрузить документ
  uploadDocument: async (
    uploadData: DocumentUploadData,
  ): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append("file", uploadData.file);

    if (uploadData.case_id) {
      formData.append("case_id", uploadData.case_id);
    }
    if (uploadData.folder_id) {
      formData.append("folder_id", uploadData.folder_id);
    }
    if (uploadData.title) {
      formData.append("title", uploadData.title);
    }

    const { data } = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (!uploadData.onUploadProgress || !progressEvent.total) return;
        const progress = Math.min(
          100,
          Math.round((progressEvent.loaded * 100) / progressEvent.total),
        );
        uploadData.onUploadProgress(progress);
      },
    });
    return data;
  },

  // Скачать документ (blob) с отслеживанием прогресса
  downloadDocument: async ({
    documentId,
    onDownloadProgress,
  }: DocumentDownloadRequest): Promise<void> => {
    const response = await api.get(`/documents/${documentId}/download`, {
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

    const contentDisposition = response.headers?.["content-disposition"] as
      | string
      | undefined;
    const fileNameMatch = contentDisposition?.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)/i,
    );
    const fileName = fileNameMatch?.[1]
      ? decodeURIComponent(fileNameMatch[1].replace(/"/g, ""))
      : `document_${documentId}`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Получить ссылку на скачивание
  getDownloadUrl: async (documentId: string): Promise<DocumentDownloadUrl> => {
    const { data } = await api.get(
      `/documents/${documentId}/url?download=true`,
    );
    return data;
  },

  // Получить ссылку для просмотра
  getPreviewUrl: async (documentId: string): Promise<DocumentDownloadUrl> => {
    const { data } = await api.get(
      `/documents/${documentId}/url?download=false`,
    );
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
  downloadFolder: async ({
    folderId,
    onDownloadProgress,
  }: FolderDownloadRequest): Promise<void> => {
    const response = await api.get(`/documents/folders/${folderId}/download`, {
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
    link.download = `folder_${folderId}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Обновить файл или папку
  updateAsset: async (
    updateData: AssetUpdateRequest,
  ): Promise<DocumentResponse | FolderResponse> => {
    const { data } = await api.patch("/documents/update", updateData);
    return data;
  },

  // Получить содержимое корзины
  getTrashDocuments: async (
    params?: DocumentsListParams,
  ): Promise<PaginatedResponse<FileSystemEntry>> => {
    const { data } = await api.get("/documents/trash", { params });
    return data;
  },

  restoreAssets: async (payload: BulkAssetsRequest): Promise<void> => {
    await api.post("/documents/restore", payload);
  },

  deleteTrashAssets: async (payload: BulkAssetsRequest): Promise<void> => {
    await api.delete("/documents/trash", { data: payload });
  },

  downloadBulk: async ({
    folder_ids,
    document_ids,
    onDownloadProgress,
  }: BulkAssetsDownloadRequest): Promise<void> => {
    const response = await api.post(
      "/documents/download-bulk",
      { folder_ids, document_ids },
      {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (!onDownloadProgress || !progressEvent.total) return;
          const progress = Math.min(
            100,
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
          onDownloadProgress(progress);
        },
      },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `documents_bulk_${new Date().toISOString().slice(0, 19)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  deleteBulk: async (payload: BulkAssetsRequest): Promise<void> => {
    await api.delete("/documents/bulk", { data: payload });
  },

  trashAssets: async (payload: BulkAssetsRequest): Promise<void> => {
    await api.post("/documents/trash", payload);
  },

  bulkMove: async (
    payload: DocumentsBulkMoveRequest,
  ): Promise<Record<string, string>> => {
    const { data } = await api.patch("/documents/bulk-move", payload);
    return data;
  },
};
