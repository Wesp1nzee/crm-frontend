export interface CalendarEvent {
  id: string;
  caseId: string;
  type: 'deadline' | 'inspection' | 'court';
  title: string;
  date: string;
  time?: string;
  caseNumber: string;
  objectAddress: string;
  expertId?: string;
  expertName?: string;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarFilters {
  expertId?: string;
  eventTypes: CalendarEvent['type'][];
}