import { Box, Paper, Typography, Chip } from '@mui/material';
import dayjs from 'dayjs';
import { getCalendarDates, getEventColor, getCurrentTimePosition } from '../../shared/utils/calendar';
import type { CalendarView, CalendarEvent } from '../../entities/calendar/types';

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 60; // Высота часа в пикселях

export function CalendarGrid({ currentDate, view, events, onDateClick, onEventClick }: CalendarGridProps) {
  const dates = getCalendarDates(currentDate, view);
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => dayjs(event.date).isSame(dayjs(date), 'day'));
  };

  const isToday = (date: Date) => dayjs(date).isSame(dayjs(), 'day');
  const isWeekend = (date: Date) => [0, 6].includes(dayjs(date).day());
  const isCurrentMonth = (date: Date) => dayjs(date).isSame(dayjs(currentDate), 'month');

  // Функция для форматирования дня недели (Пн, Вт...)
  const formatDayName = (date: Date) => {
    const day = dayjs(date).format('dd'); // Получаем "пн", "вт"
    return day.charAt(0).toUpperCase() + day.slice(1); // Делаем "Пн", "Вт"
  };

  // --- РЕЖИМ МЕСЯЦА ---
  if (view === 'month') {
    return (
      <Paper sx={{ p: 2 }}>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} mb={1}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <Typography key={day} variant="subtitle2" textAlign="center" fontWeight="bold">{day}</Typography>
          ))}
        </Box>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
          {dates.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <Box
                key={date.toISOString()}
                onClick={() => onDateClick(date)}
                sx={{
                  minHeight: 120, p: 1, border: '1px solid', borderColor: 'divider',
                  borderRadius: 1, cursor: 'pointer',
                  bgcolor: isToday(date) ? 'primary.light' : isWeekend(date) ? 'grey.50' : 'background.paper',
                  opacity: isCurrentMonth(date) ? 1 : 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="body2" fontWeight={isToday(date) ? 'bold' : 'normal'}>
                  {dayjs(date).format('D')}
                </Typography>
                <Box mt={1}>
                  {dayEvents.slice(0, 2).map((event) => (
                    <Chip
                      key={event.id}
                      label={event.title}
                      size="small"
                      sx={{ mb: 0.5, width: '100%', bgcolor: getEventColor(event.type), color: 'white', fontSize: '0.65rem', height: 18 }}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }

  // --- РЕЖИМЫ ДЕНЬ И НЕДЕЛЯ (TIME GRID) ---
  const handleGridClick = (e: React.MouseEvent, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = (y / HOUR_HEIGHT) * 60;
    const clickedDate = dayjs(date).startOf('day').add(totalMinutes, 'minute').toDate();
    onDateClick(clickedDate);
  };

  return (
    <Paper sx={{ 
      p: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 180px)', // Высота с учетом шапки, чтобы не было скролла страницы
      overflow: 'hidden' 
    }}>
      
      {/* Заголовки колонок (Пн, Вт... + Число) */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', ml: '65px' }}>
        {dates.map((date) => (
          <Box key={date.toISOString()} sx={{ 
            flex: 1, 
            p: 1, 
            textAlign: 'center', 
            borderLeft: '1px solid', 
            borderColor: 'divider',
            bgcolor: isToday(date) ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
          }}>
            <Typography variant="subtitle2" sx={{ color: isToday(date) ? 'primary.main' : 'text.primary', fontWeight: isToday(date) ? 'bold' : 'normal' }}>
              {formatDayName(date)}, {dayjs(date).format('DD.MM')}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Зона прокрутки */}
      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', position: 'relative' }}>
        
        {/* Шкала времени (00:00 - 23:00) */}
        <Box sx={{ width: 65, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', zIndex: 3 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <Box key={i} sx={{ height: HOUR_HEIGHT, textAlign: 'right', pr: 1, pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {i.toString().padStart(2, '0')}:00
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Сетка и Колонки */}
        <Box sx={{ flex: 1, display: 'flex', position: 'relative', minHeight: 24 * HOUR_HEIGHT }}>
          
          {/* Горизонтальные линии сетки (на всю ширину всех колонок) */}
          {Array.from({ length: 24 }, (_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute', top: i * HOUR_HEIGHT, left: 0, right: 0,
                height: '1px', bgcolor: 'divider', zIndex: 1, pointerEvents: 'none'
              }}
            />
          ))}

          {/* Колонки дней (одна для "День", семь для "Неделя") */}
          {dates.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <Box 
                key={date.toISOString()}
                onClick={(e) => handleGridClick(e, date)}
                sx={{ 
                  flex: 1, 
                  position: 'relative', 
                  borderRight: '1px solid', 
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' } 
                }}
              >
                {/* Текущее время (красная линия) */}
                {isToday(date) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: getCurrentTimePosition(HOUR_HEIGHT),
                      left: 0, right: 0, height: '2px', bgcolor: 'error.main', zIndex: 5,
                      '&::before': {
                        content: '""', position: 'absolute', left: -4, top: -4,
                        width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%'
                      }
                    }}
                  />
                )}

                {dayEvents.map((event) => {
                  const start = event.time ? dayjs(`${dayjs(event.date).format('YYYY-MM-DD')} ${event.time}`) : dayjs(event.date).hour(9);
                  const topPos = (start.hour() * 60 + start.minute()) * (HOUR_HEIGHT / 60);
                  const duration = 60;

                  return (
                    <Box
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      sx={{
                        position: 'absolute', 
                        top: topPos, 
                        left: '4px', 
                        right: '4px',
                        height: (duration * (HOUR_HEIGHT / 60)) - 2,
                        bgcolor: getEventColor(event.type), 
                        color: 'white',
                        p: '4px 8px', 
                        borderRadius: '4px', 
                        zIndex: 4, 
                        fontSize: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', 
                        overflow: 'hidden', 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': { filter: 'brightness(0.9)', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', lineHeight: 1.2, fontSize: '0.75rem' }}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                        {event.time || start.format('HH:mm')}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}