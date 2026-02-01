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
  role: UserRole;
  status: 'active' | 'inactive';
  workload: number;
  count_case: number;
}

export interface CreateExpertInput {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password?: string;
}

export interface UpdateExpertInput {
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  role?: UserRole;
  status: 'active' | 'inactive';
}

type UserCreateWithStatus = UserCreateType & {
  is_active?: boolean;
  can_authenticate?: boolean;
};

export const useExperts = (filters: ExpertFilters = {}) => {
  const { role = undefined, search, is_active } = filters;
  
  return useQuery({
    queryKey: ['users', { role, search, is_active }],
    queryFn: async () => {
      const params: Partial<UserFilterParams> = {};
      
      if (role !== undefined && role !== null) {
        params.role = role;
      }
      
      if (search) params.search = search;
      if (is_active !== undefined && is_active !== null) params.is_active = is_active;
      
      const response = await usersApi.getUsers(params);
      const users = response.data;

      console.log(users)

      return users.map(user => ({
        ...user,
        id: user.id,
        name: user.full_name,
        specialization: user.specialization ? [user.specialization] : [],
        role: user.role.toLowerCase() === 'accountant' ? UserRole.ACCOUNTANT : UserRole.EXPERT,
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
        role: user.role as UserRole,
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
        role: data.role.toLowerCase() as UserRole,
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateExpert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpertInput }) => {
       console.log('UPDATE id:', id, typeof id);
      const userData: UserUpdateType = {
        full_name: data.name,
        specialization: data.specialization,
        role: data.role?.toLowerCase() as UserRole,
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useDeleteExpert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      console.log('DELETE id:', id, typeof id);
      return usersApi.deleteUser(id);},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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