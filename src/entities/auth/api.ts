import { api } from '../../shared/api/axios';
import type { User, LoginRequest } from './types';

export const authApi = {
  login: (data: LoginRequest) => api.post<User>('/users/login', data),
  me: () => api.get<User>('/users/me'),
  logout: () => api.post('/users/logout'),
};