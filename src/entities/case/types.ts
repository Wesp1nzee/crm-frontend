// Новый статус для дел
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
  number: string; // Номер дела (№ п/п)
  case_number: string; // Номер дела
  authority: string; // Суд/Орган
  client_id: string;
  case_type: string; // Вид экспертизы
  object_type: string;
  object_address: string;
  status: CaseStatus;
  start_date: string; // Дата начала
  deadline: string; // Срок выполнения
  cost: number; // Стоимость
  plaintiff?: string; // Истец
  defendant?: string; // Ответчик
  bank_transfer_amount: number; // Безнал
  cash_amount: number; // Наличные
  remaining_debt: number; // Остаток долга
  completion_date?: string; // Окончена
  assigned_expert_id?: string;
  archive_status?: string; // Архив
  remarks?: string; // Примечание
  created_at: string;
  updated_at: string;
}

// Параметры запроса
export interface GetCasesQuery {
  status?: CaseStatus[];
  expert_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// Пагинация
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Статистика
export interface CasesSummary {
  active: number;
  overdue: number;
  completed: number;
}

// Ответ от бэкенда
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