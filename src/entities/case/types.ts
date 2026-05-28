export type CaseStatus =
  | "archive"
  | "in_work"
  | "debt"
  | "executed"
  | "withdrawn"
  | "cancelled"
  | "fssp";

export interface Case {
  id: string;
  client_id: string;
  number: string;
  case_number: string;
  authority: string;
  case_type: string;
  object_type: string;
  object_address: string;
  judge_name?: string;
  status: CaseStatus;
  expert_ids?: string[];
  start_date: string;
  deadline: string;
  legal_entity_type: 'ООО' | 'ИП';
  registration_date?: string | null;
  additional_materials_date?: string | null;
  execution_date?: string | null;
  completion_date?: string;
  cost: string;
  bank_transfer_amount: string;
  cash_amount: string;
  remaining_debt: string;
  plaintiff?: string;
  defendant?: string;
  expert_painting?: string;
  archive_status?: string;
  remarks?: string;
  debit: string;
  created_at: string;
  updated_at: string;
  experts: {
    id: string;
    email: string;
    full_name: string;
  }[];
}

export interface CaseDetailResponse {
  case: Case;
  client: {
    id: string;
    name: string;
    short_name?: string;
    type: "legal" | "individual" | "court";
    inn?: string;
    email?: string;
    phone?: string;
    legal_address?: string;
    actual_address?: string;
    contacts: {
      id: string;
      name: string;
      position?: string;
      email?: string;
      phone?: string;
      is_main: boolean;
      contact_type: "legal_representative" | "court_officer" | "individual";
    }[];
  };
  experts: {
    id: string;
    email: string;
    full_name: string;
  }[];
  documents: {
    id: string;
    title: string;
    original_filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    file_extension: string;
    version: number;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    folder?: {
      id: string;
      name: string;
      parent_id?: string;
    };
    uploaded_by: {
      id: string;
      email: string;
      full_name: string;
    };
  }[];
  folders: {
    id: string;
    name: string;
    parent_id?: string;
  }[];
  messages: {
    id: string;
    external_message_id: string | null;
    thread_id: string | null;
    parent_id: string | null;
    user_id: string;
    case_id: string | null;
    sender_email: string;
    sender_name: string | null;
    reply_to: string | null;
    subject: string | null;
    folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';
    message_type: 'incoming' | 'outgoing' | 'system_notification';
    status: 'draft' | 'queued' | 'sending' | 'sent' | 'delivered' | 'error' | 'failed';
    is_read: boolean;
    is_important: boolean;
    is_starred: boolean;
    is_spam: boolean;
    is_archived: boolean;
    is_deleted: boolean;
    size_bytes: number | null;
    sent_at: string | null;
    processed_at: string;
    updated_at: string;
    body_text: string | null;
    body_html: string | null;
    attachment_count: number;
    recipients: Array<{
      email_address: string;
      recipient_type: 'to' | 'cc' | 'bcc';
      name: string | null;
    }>;
    snippet: string | null;
  }[];
}

export interface CaseCreateRequest {
  client_id: string;
  number: string;
  case_number: string;
  authority: string;
  case_type: string;
  object_type: string;
  object_address: string;
  judge_name?: string;
  status?: CaseStatus;
  expert_ids?: string[];
  start_date: string;
  deadline: string;
  completion_date?: string;
  cost: number;
  bank_transfer_amount?: number;
  cash_amount?: number;
  remaining_debt?: number;
  plaintiff?: string;
  defendant?: string;
  expert_painting?: string;
  archive_status?: string;
  remarks?: string;
  debit?: number;
  legal_entity_type: 'ООО' | 'ИП';
  registration_date?: string | null;
  additional_materials_date?: string | null;
  execution_date?: string | null;
  parent_folder_id?: string | null;
}

export interface CasePatchRequest {
  number?: string;
  case_number?: string;
  authority?: string;
  client_id?: string;
  case_type?: string;
  object_type?: string;
  object_address?: string;
  judge_name?: string;
  status?: CaseStatus;
  start_date?: string;
  deadline?: string;
  cost?: string;
  plaintiff?: string;
  defendant?: string;
  bank_transfer_amount?: string;
  cash_amount?: string;
  remaining_debt?: string;
  completion_date?: string;
  archive_status?: string;
  remarks?: string;
  debit?: string;
  legal_entity_type?: 'ООО' | 'ИП';
  registration_date?: string | null;
  additional_materials_date?: string | null;
  execution_date?: string | null;
}

export interface CaseExpertsUpdateRequest {
  expert_ids: string[];
}

export interface GetCasesQuery {
  // Pagination
  page?: number;
  limit?: number;

  // Filters
  status?: CaseStatus[];
  expert_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  case_type?: string;
  object_type?: string;
  authority?: string;
  object_address?: string;
  number?: string;
  case_number?: string;
  has_assigned_expert?: boolean;

  // Cost filters
  min_cost?: number;
  max_cost?: number;
  min_remaining_debt?: number;
  max_remaining_debt?: number;

  // Date filters
  completion_start_date?: string;
  completion_end_date?: string;
  deadline_start_date?: string;
  deadline_end_date?: string;

  // Search and sorting
  search?: string;
  sort_field?: string;
  sort_order?: "asc" | "desc";
}

export interface CasesMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
  next_page_url: string | null;
  prev_page_url: string | null;
  active: number;
  overdue: number;
  completed: number;
}

export interface GetCasesResponse {
  items: Case[];
  meta: CasesMeta;
}

export interface CaseSuggestion {
  id: string;
  number: string;
  case_number: string;
}

// Остальные типы (клиенты, документы и т.д.) остаются без изменений
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Document {
  id: string;
  name: string;
  type: "contract" | "report" | "photo" | "certificate" | "other";
  size: number;
  uploadedAt: string;
  caseId?: string;
  uploadedBy: string;
  url: string;
}

export interface Invoice {
  id: string;
  number: string;
  caseId: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  description: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: "bank_transfer" | "cash" | "card";
  receivedAt: string;
  description?: string;
}
