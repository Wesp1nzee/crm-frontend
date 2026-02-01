// src/shared/hooks/useCases.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../../entities/case/api';
import type { Case, GetCasesQuery, GetCasesResponse, CaseCreateRequest } from '../../entities/case/types';

export const useCases = (params: GetCasesQuery = {}) => {
  return useQuery<GetCasesResponse>({
    queryKey: ['cases', params],
    queryFn: () => casesApi.getCases(params).then(res => res.data),
    placeholderData: (prevData) => prevData,
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