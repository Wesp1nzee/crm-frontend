import { api } from '../../shared/api/axios';
import type { UserRead, UserCreate, UserUpdate, UserFilterParams } from './types';

export const usersApi = {
  getUsers: (params?: Partial<UserFilterParams>) => {
    const queryParams = new URLSearchParams();
    
    if (params?.role) {
      queryParams.append('role', params.role.toString().toLowerCase());
    }
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.can_authenticate !== undefined) queryParams.append('can_authenticate', params.can_authenticate.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();

    return api.get<UserRead[]>(`/users/${queryString ? '?' + queryString : ''}`);
  },

  getUser: (id: string) => api.get<UserRead>(`/users/${id}`),

  createUser: (data: UserCreate) => api.post<UserRead>('/users', data),

  deleteUser: (id: string) => {
  console.log('DELETE URL:', `/users/${id}`);
  return api.delete(`/users/${id}`);
},

updateUser: (id: string, data: UserUpdate) => {
  console.log('UPDATE URL:', `/users/${id}`, 'baseURL:', api.defaults.baseURL);
  return api.patch<UserRead>(`/users/${id}`, data);
},

  getCurrentUser: () => api.get<UserRead>('/users/me'),
};