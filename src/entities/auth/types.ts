export interface User {
  email: string;
  full_name: string;
  role: 'admin' | 'ceo' | 'accountant' | 'expert';
  specialization?: string;
  id: string;
  is_active: boolean;
  can_authenticate: boolean;
  company_id: string;
  settings: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}