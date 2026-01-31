// src/shared/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Базовый URL для API
const API_BASE_URL = 'http://localhost:8000';

async function fetchCurrentUser() {
  console.log('Sending request to get current user...');
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    credentials: 'include', // Добавляем эту опцию для отправки cookies
  });
  
  console.log('Response from /api/users/me:', response.status);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Удаляем токен из localStorage при 401 ошибке
      localStorage.removeItem('token');
      console.log('401 Unauthorized - token removed from localStorage');
    }
    throw new Error(`Authentication failed: ${response.status}`);
  }
  
  const userData = await response.json();
  console.log('Current user data received:', userData);
  
  return userData;
}

async function loginUser(credentials: { email: string; password: string }) {
  console.log('Sending login request with credentials:', { 
    email: credentials.email,
    password: '[HIDDEN]' // Скрываем пароль в логах
  });
  
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
    credentials: 'include', // Добавляем эту опцию для получения и сохранения cookies
  });

  console.log('Login response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Login successful - response data:', data);
  
  // Сохраняем токен или сессионные данные
  if (data.token) {
    localStorage.setItem('token', data.token);
    console.log('Token saved to localStorage');
  }
  
  return data;
}

async function logoutUser() {
  console.log('Sending logout request...');
  const response = await fetch(`${API_BASE_URL}/api/users/logout`, {
    method: 'POST',
    credentials: 'include', // Добавляем эту опцию для отправки cookies
  });
  
  console.log('Logout response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }
  
  // Удаляем токен при успешном логауте
  localStorage.removeItem('token');
  console.log('Token removed from localStorage after logout');
  
  return response.json();
}

export function useAuth() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    retry: (failureCount, error) => {
      // Не повторяем запрос при 401 ошибке
      const status = (error as any)?.response?.status;
      console.log('Auth check failed, retry decision:', { status, shouldRetry: status !== 401 && failureCount < 1 });
      return status !== 401 && failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
    gcTime: 10 * 60 * 1000,   // 10 минут хранения в кэше
    refetchOnWindowFocus: false, // Отключаем автоматическую проверку при фокусировке окна
    refetchOnReconnect: false,   // Отключаем проверку при восстановлении соединения
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      console.log('Login successful, invalidating currentUser cache');
      // Инвалидируем кэш текущего пользователя после успешного логина
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      console.log('Logout successful, removing currentUser cache and navigating to login');
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      console.error('Logout error:', error);
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      localStorage.removeItem('token');
      console.log('Token removed after logout error, navigating to login');
      navigate('/login', { replace: true });
    }
  });
}