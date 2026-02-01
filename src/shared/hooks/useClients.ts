// src/shared/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  clientApi,
} from '../../entities/client/api';
import { 
  type ClientFull, 
  type ClientCreateRequest, 
  type ClientUpdateRequest,
  type ClientFilters,
  type ClientListResponse 
} from '../../entities/client/types';

/**
 * Хук для получения списка клиентов с пагинацией и фильтрацией
 */
export const useClients = (filters?: ClientFilters) => {
  return useQuery<ClientListResponse>({
    queryKey: ['clients', filters],
    queryFn: () => clientApi.getClients(filters)
      .then(res => {
        return res.data;
      }),
    placeholderData: (prevData) => prevData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
/**
 * Хук для получения клиента по ID
 */
export const useClient = (id: string) => {
  return useQuery<ClientFull>({
    queryKey: ['client', id],
    queryFn: () => clientApi.getClient(id).then(res => res.data),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Хук для создания клиента
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
   
    mutationFn: (request: ClientCreateRequest) => 
      clientApi.createClient(request).then(res => res.data),
    
    onSuccess: (newClient) => {
      console.log('[CLIENT_HOOK] Клиент создан:', newClient.id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.setQueryData(['client', newClient.id], newClient);
    },
    
    onError: (error: unknown) => {
      console.error('[CLIENT_HOOK] Ошибка создания клиента:', error);
    },
  });
};

/**
 * Хук для обновления клиента
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdateRequest }) => 
      clientApi.updateClient(id, data).then(res => res.data),
    
    onSuccess: (updatedClient) => {
      console.log('[CLIENT_HOOK] Клиент обновлен:', updatedClient.id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.setQueryData(['client', updatedClient.id], updatedClient);
    },
    
    onError: (error: unknown) => {
      console.error('[CLIENT_HOOK] Ошибка обновления клиента:', error);
    },
  });
};

/**
 * Хук для удаления клиента
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => clientApi.deleteClient(id),
    
    onSuccess: (_, id) => {
      console.log('[CLIENT_HOOK] Клиент удален:', id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.removeQueries({ queryKey: ['client', id] });
    },
    
    onError: (error: unknown) => {
      console.error('[CLIENT_HOOK] Ошибка удаления клиента:', error);
    },
  });
};