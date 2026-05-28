import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "../../entities/document/api";
import { casesApi } from "../../entities/case/api";
import type {
  DocumentsListParams,
  PaginatedResponse,
  FileSystemEntry,
  FolderCreate,
  DocumentUploadData,
  AssetUpdateRequest,
  DocumentDownloadRequest,
  FolderDownloadRequest,
  BulkAssetsDownloadRequest,
  DocumentsBulkMoveRequest,
} from "../../entities/document/types";
import type { CaseSuggestion } from "../../entities/case/types";

export const useDocuments = (params?: DocumentsListParams) => {
  return useQuery<PaginatedResponse<FileSystemEntry>>({
    queryKey: ["documents", params],
    queryFn: () => documentsApi.getDocuments(params),
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderData: FolderCreate) =>
      documentsApi.createFolder(folderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uploadData: DocumentUploadData) =>
      documentsApi.uploadDocument(uploadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (payload: DocumentDownloadRequest) =>
      documentsApi.downloadDocument(payload),
  });
};

export const usePreviewDocument = () => {
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.getPreviewUrl(documentId),
    onSuccess: (data) => {
      window.open(data.download_url, "_blank");
    },
  });
};

export const useDownloadFolder = () => {
  return useMutation({
    mutationFn: (payload: FolderDownloadRequest) =>
      documentsApi.downloadFolder(payload),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => documentsApi.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useCaseSuggestions = (query: string) => {
  return useQuery<CaseSuggestion[]>({
    queryKey: ["cases", "suggest", query],
    queryFn: () => casesApi.getSuggestions(query),
    enabled: query.length > 0,
    staleTime: 30000,
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData: AssetUpdateRequest) =>
      documentsApi.updateAsset(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useDownloadBulkAssets = () => {
  return useMutation({
    mutationFn: (payload: BulkAssetsDownloadRequest) =>
      documentsApi.downloadBulk(payload),
  });
};

export const useDeleteBulkAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { folder_ids: string[]; document_ids: string[] }) =>
      documentsApi.deleteBulk(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useTrashAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { folder_ids: string[]; document_ids: string[] }) =>
      documentsApi.trashAssets(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents", "trash"] });
    },
  });
};

export const useTrashDocuments = (params?: DocumentsListParams) => {
  return useQuery<PaginatedResponse<FileSystemEntry>>({
    queryKey: ["documents", "trash", params],
    queryFn: () => documentsApi.getTrashDocuments(params),
  });
};

export const useRestoreAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { folder_ids: string[]; document_ids: string[] }) =>
      documentsApi.restoreAssets(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "trash"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};

export const useDeleteTrashAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { folder_ids: string[]; document_ids: string[] }) =>
      documentsApi.deleteTrashAssets(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", "trash"] });
    },
  });
};

export const useBulkMoveDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DocumentsBulkMoveRequest) =>
      documentsApi.bulkMove(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
};
