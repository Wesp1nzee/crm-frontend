// src/shared/hooks/useCases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../../entities/case/api';
import type { Case, GetCasesQuery, GetCasesResponse, CaseCreateRequest, CaseDetailResponse, CasePatchRequest } from '../../entities/case/types';

export const useCases = (params: GetCasesQuery = {}) => {
  console.log('useCases params:', params);
  return useQuery<GetCasesResponse>({
    queryKey: ['cases', params],
    queryFn: () => casesApi.getCases(params).then(res => res.data),
    placeholderData: (prevData) => prevData,
  });
};

export const useCase = (id: string) => {
  return useQuery<CaseDetailResponse>({
    queryKey: ['case', id],
    queryFn: () => casesApi.getCase(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => Promise.resolve({ id, name: 'Mock Client', email: 'client@example.com' }),
    enabled: !!id,
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CaseCreateRequest) =>
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
      queryClient.invalidateQueries({ queryKey: ['case'] });
    },
  });
};

export const usePatchCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CasePatchRequest }) =>
      casesApi.patchCase(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
    },
  });
};

export const useDeleteCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => casesApi.deleteCase(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
    },
  });
};

export const useDownloadCaseDocuments = () => {
  return useMutation({
    mutationFn: (caseId: string) => casesApi.downloadCaseDocuments(caseId),
  });
};

// Mock data for invoices and payments
const mockInvoices = [
  { id: '1', caseId: '1', amount: 50000, status: 'paid' as const, createdAt: '2024-01-15', dueDate: '2024-02-15', description: 'Экспертиза' },
  { id: '2', caseId: '2', amount: 75000, status: 'sent' as const, createdAt: '2024-01-20', dueDate: '2024-02-20', description: 'Оценка' },
];

const mockPayments = [
  { id: '1', invoiceId: '1', amount: 50000, method: 'bank_transfer' as const, receivedAt: '2024-01-20', description: 'Оплата за экспертизу' },
];

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => Promise.resolve(mockInvoices),
  });
};

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => Promise.resolve(mockPayments),
  });
};