import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../../entities/calendar/api';
import type { CalendarEvent } from '../../entities/calendar/types';

export const useCalendarEvents = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: () => calendarApi.getEvents(startDate, endDate).then(res => res.data),
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<CalendarEvent, 'id'>) =>
      calendarApi.createEvent(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};