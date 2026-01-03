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

export function CalendarGrid({ currentDate, view, events, onDateClick, onEventClick }: CalendarGridProps) {
  const dates = getCalendarDates(currentDate, view);
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => dayjs(event.date).isSame(dayjs(date), 'day'));
  };

  const isToday = (date: Date) => dayjs(date).isSame(dayjs(), 'day');
  const isWeekend = (date: Date) => [0, 6].includes(dayjs(date).day());
  const isCurrentMonth = (date: Date) => dayjs(date).isSame(dayjs(currentDate), 'month');

  if (view === 'month') {
    return (
      <Paper sx={{ p: 2 }}>
        {/* Week headers */}
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1} mb={1}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <Typography key={day} variant="subtitle2" textAlign="center" fontWeight="bold">
              {day}
            </Typography>
          ))}
        </Box>
        
        {/* Calendar grid */}
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
          {dates.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <Box
                key={date.toISOString()}
                onClick={() => onDateClick(date)}
                sx={{
                  minHeight: 120,
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isToday(date) ? 'primary.light' : isWeekend(date) ? 'grey.50' : 'background.paper',
                  opacity: isCurrentMonth(date) ? 1 : 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="body2" fontWeight={isToday(date) ? 'bold' : 'normal'}>
                  {dayjs(date).format('D')}
                </Typography>
                <Box mt={1}>
                  {/* Event indicators */}
                  {dayEvents.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <Box
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          sx={{
                            width: 8,
                            height: 8,
                            bgcolor: getEventColor(event.type),
                            borderRadius: '50%',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {/* Event chips */}
                  {dayEvents.slice(0, 2).map((event) => (
                    <Chip
                      key={event.id}
                      label={event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      sx={{
                        mb: 0.5,
                        width: '100%',
                        bgcolor: getEventColor(event.type),
                        color: 'white',
                        fontSize: '0.65rem',
                        height: 18,
                        '& .MuiChip-label': {
                          px: 0.5,
                        },
                      }}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      +{dayEvents.length - 2} еще
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }

  if (view === 'week') {
    return (
      <Paper sx={{ p: 2 }}>
        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
          {dates.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <Box key={date.toISOString()}>
                <Typography variant="subtitle2" textAlign="center" mb={1}>
                  {dayjs(date).format('ddd DD')}
                </Typography>
                <Box
                  onClick={() => onDateClick(date)}
                  sx={{
                    minHeight: 400,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: isToday(date) ? 'primary.light' : isWeekend(date) ? 'grey.50' : 'background.paper',
                    position: 'relative',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {/* Event indicators */}
                  {dayEvents.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {dayEvents.map((event) => (
                        <Box
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          sx={{
                            width: 6,
                            height: 6,
                            bgcolor: getEventColor(event.type),
                            borderRadius: '50%',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {dayEvents.slice(0, 4).map((event, index) => (
                    <Chip
                      key={event.id}
                      label={`${event.time || ''} ${event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title}`}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      sx={{
                        mb: 0.5,
                        width: '100%',
                        bgcolor: getEventColor(event.type),
                        color: 'white',
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      +{dayEvents.length - 4} еще
                    </Typography>
                  )}
                  {isToday(date) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: `${getCurrentTimePosition()}%`,
                        left: 0,
                        right: 0,
                        height: 2,
                        bgcolor: 'error.main',
                        zIndex: 1,
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  }

  // Day view
  const dayEvents = getEventsForDate(currentDate);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>
        {dayjs(currentDate).format('dddd, DD MMMM YYYY')}
      </Typography>
      <Box
        sx={{
          position: 'relative',
          height: 600,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {/* Time grid */}
        <Box sx={{ position: 'relative', height: '100%', ml: 6 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: `${(i / 24) * 100}%`,
                left: -48,
                right: 0,
                height: 1,
                bgcolor: 'divider',
                '&::before': {
                  content: `"${i.toString().padStart(2, '0')}:00"`,
                  position: 'absolute',
                  left: -40,
                  top: -8,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  width: 35,
                  textAlign: 'right',
                },
              }}
            />
          ))}
          
          {/* Clickable area */}
          <Box
            onClick={() => onDateClick(currentDate)}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          />
          
          {/* Events */}
          {dayEvents.map((event, index) => {
            const hour = event.time ? parseInt(event.time.split(':')[0]) : 9;
            const minute = event.time ? parseInt(event.time.split(':')[1]) : 0;
            const topPosition = ((hour * 60 + minute) / (24 * 60)) * 100;
            
            return (
              <Box
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                sx={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  top: `${topPosition}%`,
                  height: 40,
                  bgcolor: getEventColor(event.type),
                  color: 'white',
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {event.time} {event.title}
                </Typography>
              </Box>
            );
          })}
          
          {/* Current time indicator */}
          {isToday(currentDate) && (
            <Box
              sx={{
                position: 'absolute',
                top: `${getCurrentTimePosition()}%`,
                left: -48,
                right: 0,
                height: 2,
                bgcolor: 'error.main',
                zIndex: 20,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -6,
                  top: -4,
                  width: 10,
                  height: 10,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                },
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}