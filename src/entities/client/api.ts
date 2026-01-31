import { api } from '../../shared/api/axios';
import type {  
  ClientFull, 
  ClientCreateRequest, 
  ClientUpdateRequest,
  ClientFilters,
  ClientListResponse 
} from './types';

const API_PREFIX = '/clients';

/**
 * Получение списка клиентов с пагинацией и фильтрацией
 * @param params - параметры фильтрации и пагинации
 * @returns список клиентов с метаданными
 */
export const clientApi = {
  getClients: (params?: ClientFilters) => {
    console.log('[CLIENT_API] Запрос списка клиентов:', { 
      endpoint: `${API_PREFIX}`, 
      params 
    });
    
    return api.get<ClientListResponse>(API_PREFIX, { params })
      .then(res => {
        console.log('[CLIENT_API] Успешно получено клиентов:', {
          total: res.data.total,
          page: res.data.page,
          size: res.data.size,
          items: res.data.items.length
        });
        return res;
      })
      .catch(error => {
        console.error('[CLIENT_API] Ошибка получения списка клиентов:', {
          status: error.response?.status,
          message: error.response?.data?.detail || error.message,
          stack: error.stack
        });
        throw error;
      });
  },

  /**
   * Получение клиента по ID
   */
  getClient: (id: string) => {
    console.log('[CLIENT_API] Запрос клиента:', { id, endpoint: `${API_PREFIX}/${id}` });
    
    return api.get<ClientFull>(`${API_PREFIX}/${id}`)
      .then(res => {
        console.log('[CLIENT_API] Клиент получен:', { 
          id: res.data.id, 
          name: res.data.name,
          type: res.data.type 
        });
        return res;
      })
      .catch(error => {
        console.error('[CLIENT_API] Ошибка получения клиента:', {
          id,
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        throw error;
      });
  },

  /**
   * Создание нового клиента
   */
  createClient: (data: ClientCreateRequest) => {
    console.log('[CLIENT_API] Создание клиента:', { 
      endpoint: API_PREFIX, 
      name: data.name,
      type: data.type,
      hasContact: !!data.initial_contact 
    });
    
    return api.post<ClientFull>(API_PREFIX, data)
      .then(res => {
        console.log('[CLIENT_API] Клиент успешно создан:', {
          id: res.data.id,
          name: res.data.name,
          inn: res.data.inn
        });
        return res;
      })
      .catch(error => {
        console.error('[CLIENT_API] Ошибка создания клиента:', {
          name: data.name,
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        throw error;
      });
  },

  /**
   * Обновление клиента
   */
  updateClient: (id: string, data: ClientUpdateRequest) => {
    console.log('[CLIENT_API] Обновление клиента:', { id, endpoint: `${API_PREFIX}/${id}`, fields: Object.keys(data) });
    
    return api.put<ClientFull>(`${API_PREFIX}/${id}`, data)
      .then(res => {
        console.log('[CLIENT_API] Клиент обновлен:', { 
          id: res.data.id, 
          updatedFields: Object.keys(data) 
        });
        return res;
      })
      .catch(error => {
        console.error('[CLIENT_API] Ошибка обновления клиента:', {
          id,
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        throw error;
      });
  },

  /**
   * Удаление клиента
   */
  deleteClient: (id: string) => {
    console.log('[CLIENT_API] Удаление клиента:', { id, endpoint: `${API_PREFIX}/${id}` });
    
    return api.delete(`${API_PREFIX}/${id}`)
      .then(res => {
        console.log('[CLIENT_API] Клиент удален:', { id });
        return res;
      })
      .catch(error => {
        console.error('[CLIENT_API] Ошибка удаления клиента:', {
          id,
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        throw error;
      });
  },
};