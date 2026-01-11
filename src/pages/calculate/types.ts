export interface CalculationTable {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'completed';
}

export interface CalculationType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface CalculationCardProps {
  type: CalculationType;
  tablesCount: number;
  completedCount: number;
  onCreateTable: (typeId: string) => void;
  onShowTables: (typeId: string) => void;
}