import dayjs from 'dayjs';
import type { CalendarView, CalendarEvent, CalendarFilters } from '../../entities/calendar/types';

export const getCalendarDates = (date: Date, view: CalendarView) => {
  const dayjsDate = dayjs(date);
  
  switch (view) {
    case 'month':
      const monthStart = dayjsDate.startOf('month');
      const monthEnd = dayjsDate.endOf('month');
      const calendarStart = monthStart.startOf('week');
      const calendarEnd = monthEnd.endOf('week');
      const dates = [];
      let current = calendarStart;
      while (current.isBefore(calendarEnd) || current.isSame(calendarEnd, 'day')) {
        dates.push(current.toDate());
        current = current.add(1, 'day');
      }
      return dates;
    
    case 'week':
      const weekStart = dayjsDate.startOf('week');
      const dates2 = [];
      for (let i = 0; i < 7; i++) {
        dates2.push(weekStart.add(i, 'day').toDate());
      }
      return dates2;
    
    case 'day':
      return [date];
    
    default:
      return [];
  }
};

export const filterEvents = (events: CalendarEvent[], filters: CalendarFilters) => {
  return events.filter(event => {
    const expertMatch = !filters.expertId || event.expertId === filters.expertId;
    const typeMatch = filters.eventTypes.length === 0 || filters.eventTypes.includes(event.type);
    return expertMatch && typeMatch;
  });
};

export const getEventColor = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'deadline': return '#f44336';
    case 'inspection': return '#2196f3';
    case 'court': return '#4caf50';
    default: return '#9e9e9e';
  }
};

export const getEventTypeLabel = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'deadline': return 'Дедлайн';
    case 'inspection': return 'Осмотр';
    case 'court': return 'Суд';
    default: return 'Событие';
  }
};

export const formatDateHeader = (date: Date, view: CalendarView) => {
  const dayjsDate = dayjs(date);
  switch (view) {
    case 'month': return dayjsDate.format('MMMM YYYY');
    case 'week':
      const weekStart = dayjsDate.startOf('week');
      const weekEnd = dayjsDate.endOf('week');
      return `${weekStart.format('DD MMM')} - ${weekEnd.format('DD MMM YYYY')}`;
    case 'day': return dayjsDate.format('DD MMMM YYYY');
    default: return '';
  }
};

// Исправленная позиция текущего времени (возвращает пиксели для точности)
export const getCurrentTimePosition = (hourHeight: number = 60) => {
  const now = dayjs();
  const minutes = now.hour() * 60 + now.minute();
  return minutes * (hourHeight / 60);
};