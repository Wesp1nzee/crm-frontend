import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../entities/auth/api';
import type { LoginRequest } from '../../entities/auth/types';

export const useAuth = () => {
  return useQuery({
    queryKey: ['auth'],
    queryFn: () => authApi.me().then(res => res.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data).then(res => res.data),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
    },
  });
};