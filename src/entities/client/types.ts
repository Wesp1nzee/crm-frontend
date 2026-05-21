export type ClientType = "legal" | "individual" | "court";
export type LegalEntityType = "ООО" | "ИП";
export type ContactType =
  | "legal_representative"
  | "court_officer"
  | "individual";

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

export interface ContactCreate extends Omit<ContactBase, "is_main"> {
  client_id?: string;
  is_main?: boolean;
}

export interface ContactUpdate {
  name?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  is_main?: boolean | null;
  contact_type?: ContactType | null;
}

// ===== ПИСЬМА =====
export interface ClientEmail {
  id: string;
  thread_id: string;
  subject: string | null;
  sender_email: string;
  sender_name: string | null;
  message_type: "incoming" | "outgoing";
  folder: "inbox" | "sent" | "drafts" | "spam" | "trash";
  is_read: boolean;
  sent_at: string | null;
  case_id: string | null;
  case_number: string | null;
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
  notes?: string;
  legal_entity_type?: LegalEntityType;
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
  recent_emails: ClientEmail[];
}

// ===== ФИЛЬТРЫ И ПАГИНАЦИЯ =====
export interface ClientFilters {
  type?: ClientType;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: "name" | "type" | "created_at";
  sort_dir?: "asc" | "desc";
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
  short_name?: string | null;
  type?: ClientType;
  inn?: string | null;
  email?: string | null;
  phone?: string | null;
  legal_address?: string | null;
  actual_address?: string | null;
  notes?: string | null;
  legal_entity_type?: LegalEntityType | null;
}
