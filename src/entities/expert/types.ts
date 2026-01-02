export interface Expert {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  status: 'active' | 'inactive';
  workload: number; // количество активных дел
  createdAt: string;
}

export interface Assignment {
  id: string;
  caseId: string;
  expertId: string;
  assignedAt: string;
  assignedBy: string;
  notes?: string;
}