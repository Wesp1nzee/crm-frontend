export type UserRole = 'admin' | 'ceo' | 'accountant' | 'expert';

export interface User {
  email: string;
  full_name: string;
  role: UserRole;
  specialization?: string;
  id: string;
  is_active: boolean;
  can_authenticate: boolean;
  company_id: string;
  settings: Record<string, any>;
}

export const ROLE_PERMISSIONS = {
  admin: ['all'],
  ceo: ['all'],
  accountant: ['all'],
  expert: ['cases', 'clients', 'documents', 'calendar', 'calculate', 'profile', 'settings']
} as const;

export const RESTRICTED_ROUTES_FOR_EXPERT = [
  '/experts',
  '/finance', 
  '/reports',
  '/mail'
];