import { api } from '../../shared/api/axios';
import dayjs from 'dayjs';
import type { CalendarEvent } from './types';

// Mock calendar events based on existing cases
const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    caseId: '1',
    type: 'deadline',
    title: 'Срок выполнения ЭКС-2024-001',
    date: '2024-02-15',
    time: '18:00',
    caseNumber: 'ЭКС-2024-001',
    objectAddress: 'г. Москва, ул. Тверская, д. 1',
    expertId: '1',
    expertName: 'Петров П.П.',
  },
  {
    id: '2',
    caseId: '1',
    type: 'inspection',
    title: 'Осмотр объекта ЭКС-2024-001',
    date: '2024-02-10',
    time: '10:00',
    caseNumber: 'ЭКС-2024-001',
    objectAddress: 'г. Москва, ул. Тверская, д. 1',
    expertId: '1',
    expertName: 'Петров П.П.',
  },
  {
    id: '3',
    caseId: '2',
    type: 'court',
    title: 'Судебное заседание ЭКС-2024-002',
    date: '2024-02-20',
    time: '14:00',
    caseNumber: 'ЭКС-2024-002',
    objectAddress: 'г. Москва, Красная площадь, д. 1',
    expertId: '2',
    expertName: 'Сидорова А.И.',
  },
  {
    id: '4',
    caseId: '2',
    type: 'deadline',
    title: 'Срок выполнения ЭКС-2024-002',
    date: '2024-03-01',
    time: '18:00',
    caseNumber: 'ЭКС-2024-002',
    objectAddress: 'г. Москва, Красная площадь, д. 1',
    expertId: '2',
    expertName: 'Сидорова А.И.',
  },
  {
    id: '5',
    caseId: '4',
    type: 'inspection',
    title: 'Осмотр объекта ЭКС-2024-004',
    date: '2024-02-05',
    time: '11:00',
    caseNumber: 'ЭКС-2024-004',
    objectAddress: 'г. СПб, Невский пр., д. 100',
  },
  // Добавляем события на текущий месяц для тестирования
  {
    id: '6',
    caseId: '1',
    type: 'inspection',
    title: 'Повторный осмотр',
    date: dayjs().format('YYYY-MM-DD'),
    time: '14:30',
    caseNumber: 'ЭКС-2024-001',
    objectAddress: 'г. Москва, ул. Тверская, д. 1',
    expertId: '1',
    expertName: 'Петров П.П.',
  },
  {
    id: '7',
    caseId: '2',
    type: 'deadline',
    title: 'Подача документов',
    date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    time: '16:00',
    caseNumber: 'ЭКС-2024-002',
    objectAddress: 'г. Москва, Красная площадь, д. 1',
    expertId: '2',
    expertName: 'Сидорова А.И.',
  },
  {
    id: '8',
    caseId: '3',
    type: 'court',
    title: 'Заседание по делу',
    date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    time: '10:00',
    caseNumber: 'ЭКС-2024-003',
    objectAddress: 'МО, г. Подольск, ул. Промышленная, д. 15',
    expertId: '1',
    expertName: 'Петров П.П.',
  },
];

export const calendarApi = {
  getEvents: (startDate?: string, endDate?: string) => 
    Promise.resolve({ data: mockCalendarEvents }),
  createEvent: (data: Omit<CalendarEvent, 'id'>) => 
    Promise.resolve({ data: { ...data, id: Date.now().toString() } }),
};