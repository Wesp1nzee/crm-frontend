import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi, clientsApi, documentsApi, invoicesApi, paymentsApi } from '../../entities/case/api';
import type { Case } from '../../entities/case/types';

export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => casesApi.getCases().then(res => res.data),
  });
};

export const useCase = (id: string) => {
  return useQuery({
    queryKey: ['case', id],
    queryFn: () => casesApi.getCase(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useUpdateCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Case> }) =>
      casesApi.updateCase(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
};

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients().then(res => res.data),
  });
};

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getDocuments().then(res => res.data),
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => documentsApi.uploadDocument(formData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getInvoices().then(res => res.data),
  });
};

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getPayments().then(res => res.data),
  });
};