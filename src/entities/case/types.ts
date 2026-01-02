export interface Case {
  id: string;
  caseNumber: string;
  authority: string;
  clientId: string;
  caseType: string;
  objectType: string;
  objectAddress: string;
  status: 'new' | 'accepted' | 'awaiting_documents' | 'inspection' | 'in_progress' | 'on_check' | 'done' | 'closed';
  assignedExpertId?: string;
  startDate: string;
  deadline: string;
  cost: number;
  createdAt: string;
}

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