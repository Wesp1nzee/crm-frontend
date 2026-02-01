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
  cost: number;
  bank_transfer_amount: number;
  cash_amount: number;
  remaining_debt: number;
  plaintiff?: string;
  defendant?: string;
  expert_painting?: string;
  archive_status?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
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

export interface GetCasesQuery {
  status?: CaseStatus[];
  expert_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
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