export type CaseStatus = 
  | 'archive' 
  | 'in_work' 
  | 'debt' 
  | 'executed' 
  | 'withdrawn' 
  | 'cancelled' 
  | 'fssp';

export interface Case {
  id: string;
  client_id: string;
  number: string;
  case_number: string;
  authority: string;
  case_type: string;
  object_type: string;
  object_address: string;
  status: CaseStatus;
  assigned_user_id?: string;
  start_date: string;
  deadline: string;
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
  created_at: string;
  updated_at: string;
  assigned_expert?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface CaseDetailResponse {
  case: Case;
  client: {
    id: string;
    name: string;
    short_name?: string;
    type: 'legal' | 'individual' | 'court';
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
      contact_type: 'legal_representative' | 'court_officer' | 'individual';
    }[];
  };
  assigned_experts: {
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
  events: {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
    direction: string;
    created_at: string;
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
  status?: CaseStatus;
  assigned_user_id?: string;
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
}

export interface CasePatchRequest {
  number?: string;
  case_number?: string;
  authority?: string;
  client_id?: string;
  case_type?: string;
  object_type?: string;
  object_address?: string;
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
  assigned_user_id?: string;
  archive_status?: string;
  remarks?: string;
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
  sort_order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CasesSummary {
  active: number;
  overdue: number;
  completed: number;
}

export interface GetCasesResponse {
  data: Case[];
  pagination: PaginationInfo;
  summary: CasesSummary;
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
  type: 'contract' | 'report' | 'photo' | 'certificate' | 'other';
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
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  description: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'bank_transfer' | 'cash' | 'card';
  receivedAt: string;
  description?: string;
}