import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../../entities/document/api';
import { casesApi } from '../../entities/case/api';
import type {
  DocumentsListParams,
  FolderCreate,
  DocumentUploadData,
  AssetUpdateRequest,
} from '../../entities/document/types';

export const useDocuments = (params?: DocumentsListParams) => {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getDocuments(params),
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (folderData: FolderCreate) => documentsApi.createFolder(folderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (uploadData: DocumentUploadData) => documentsApi.uploadDocument(uploadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.getDownloadUrl(documentId),
    onSuccess: (data) => {
      window.open(data.download_url, '_blank');
    },
  });
};

export const usePreviewDocument = () => {
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.getPreviewUrl(documentId),
    onSuccess: (data) => {
      window.open(data.download_url, '_blank');
    },
  });
};

export const useDownloadFolder = () => {
  return useMutation({
    mutationFn: (folderId: string) => documentsApi.downloadFolder(folderId),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (folderId: string) => documentsApi.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useCaseSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['cases', 'suggest', query],
    queryFn: () => casesApi.getSuggestions(query),
    enabled: query.length > 0,
    staleTime: 30000,
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updateData: AssetUpdateRequest) => documentsApi.updateAsset(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};