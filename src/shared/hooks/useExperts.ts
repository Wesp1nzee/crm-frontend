import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../entities/user/api';
import type { UserCreate as UserCreateType, UserUpdate as UserUpdateType, UserFilterParams } from '../../entities/user/types';
import { UserRole } from '../../shared/types/user'; 

export interface ExpertFilters {
  role?: UserRole | null;
  search?: string;
  is_active?: boolean | null;
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  status: 'active' | 'inactive';
  workload: number;
  count_case: number;
}

export interface CreateExpertInput {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: 'active' | 'inactive';
  password?: string;
}

export interface UpdateExpertInput {
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status: 'active' | 'inactive';
}


type UserCreateWithStatus = UserCreateType & {
  is_active?: boolean;
  can_authenticate?: boolean;
};

export const useExperts = (filters: ExpertFilters = {}) => {
  const { role = null, search, is_active } = filters;
  
  return useQuery({
    queryKey: ['users', { role, search, is_active }],
    queryFn: async () => {
      const params: Partial<UserFilterParams> = {};
      
      if (role !== null && role !== undefined) {
        params.role = role;
      }
      
      if (search) params.search = search;
      if (is_active !== undefined && is_active !== null) params.is_active = is_active;
      
      const response = await usersApi.getUsers(params);
      const users = response.data;

      return users.map(user => ({
        ...user,
        id: user.id,
        name: user.full_name,
        specialization: user.specialization ? [user.specialization] : [],
        status: user.is_active ? 'active' : 'inactive',
        workload: 0,
        phone: user.settings?.phone || '', 
        count_case: user.count_case || 0,
      }));
    },
  });
};

export const useExpert = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id).then(res => {
      const user = res.data;
      return {
        ...user,
        id: user.id,
        name: user.full_name,
        specialization: user.specialization ? [user.specialization] : [],
        status: user.is_active ? 'active' : 'inactive',
        workload: 0,
        phone: user.settings?.phone || '',
        count_case: user.count_case || 0,
      };
    }),
    enabled: !!id,
  });
};

export const useCreateExpert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpertInput) => {
      const isActive = data.status === 'active';
      
      const userData: UserCreateWithStatus = {
        email: data.email,
        full_name: data.name.trim(),
        role: UserRole.EXPERT.toLowerCase() as UserRole, 
        password: data.password || generateRandomPassword(),
        is_active: isActive,
        can_authenticate: isActive,
        ...(data.specialization ? { specialization: data.specialization } : {}),
        ...(data.phone ? { settings: { phone: data.phone } } : { settings: {} }),
      };

      const response = await usersApi.createUser(userData as UserCreateType);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', { role: UserRole.EXPERT }] });
    },
  });
};

export const useUpdateExpert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpertInput }) => {
      const userData: UserUpdateType = {
        full_name: data.name,
        specialization: data.specialization,
        can_authenticate: data.status === 'active',
        settings: {
          phone: data.phone,
        },
        ...(data.email && { email: data.email }),
      };
      
      const response = await usersApi.updateUser(id, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', { role: UserRole.EXPERT }] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useDeleteExpert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', { role: UserRole.EXPERT }] });
    },
  });
};

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}