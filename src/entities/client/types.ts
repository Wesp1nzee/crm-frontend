export type ClientType = 'legal' | 'individual' | 'court';
export type ContactType = 'legal_representative' | 'court_officer' | 'individual';

// ===== КОНТАКТЫ =====
export interface ContactBase {
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_main: boolean;
  contact_type: ContactType;
}

export interface Contact extends ContactBase {
  id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

// ===== КЛИЕНТЫ =====
export interface ClientBase {
  name: string;
  short_name?: string;
  type: ClientType;
  inn?: string;
  email?: string;
  phone?: string;
  legal_address?: string;
  actual_address?: string;
}

export interface ClientShort extends ClientBase {
  id: string;
  created_at: string;
  active_cases: number;
  total_cases: number;
}

export interface ClientFull extends ClientShort {
  updated_at: string;
  contacts: Contact[];
}

// ===== ФИЛЬТРЫ И ПАГИНАЦИЯ =====
export interface ClientFilters {
  type?: ClientType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientListResponse {
  items: ClientShort[];
  meta: {
    total_items: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

// ===== DTO ДЛЯ СОЗДАНИЯ/ОБНОВЛЕНИЯ =====
export interface ClientCreateRequest extends ClientBase {
  initial_contact?: ContactBase;
}

export interface ClientUpdateRequest {
  name?: string;
  short_name?: string;
  type?: ClientType;
  inn?: string;
  email?: string;
  phone?: string;
  legal_address?: string;
  actual_address?: string;
}
