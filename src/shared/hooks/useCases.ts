import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi, clientsApi, documentsApi, invoicesApi, paymentsApi, expertsApi, assignmentsApi } from '../../entities/case/api';
import type { Case } from '../../entities/case/types';
import type { Expert, Assignment } from '../../entities/expert/types';

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

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Case, 'id' | 'createdAt'>) =>
      casesApi.createCase(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
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

// Эксперты
export const useExperts = () => {
  return useQuery({
    queryKey: ['experts'],
    queryFn: () => expertsApi.getExperts().then(res => res.data),
  });
};

export const useExpert = (id: string) => {
  return useQuery({
    queryKey: ['expert', id],
    queryFn: () => expertsApi.getExpert(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreateExpert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Expert, 'id' | 'createdAt' | 'workload'>) =>
      expertsApi.createExpert(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    },
  });
};

export const useUpdateExpert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expert> }) =>
      expertsApi.updateExpert(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    },
  });
};

export const useDeleteExpert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => expertsApi.deleteExpert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    },
  });
};

// Назначения
export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentsApi.getAssignments().then(res => res.data),
  });
};

export const useAssignCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Assignment, 'id' | 'assignedAt'>) =>
      assignmentsApi.assignCase(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    },
  });
};

export const useUnassignCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (caseId: string) => assignmentsApi.unassignCase(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
    },
  });
};