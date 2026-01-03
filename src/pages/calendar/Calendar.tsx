import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { CalendarGrid } from './CalendarGrid';
import { EventModal } from './EventModal';
import { CreateEventDialog } from './CreateEventDialog';
import { useCalendarEvents } from '../../shared/hooks/useCalendar';
import { useExperts } from '../../shared/hooks/useCases';
import { filterEvents, formatDateHeader, getEventTypeLabel } from '../../shared/utils/calendar';
import type { CalendarView, CalendarEvent, CalendarFilters } from '../../entities/calendar/types';

export function Calendar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(isMobile ? 'day' : 'month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    expertId: '',
    eventTypes: ['deadline', 'inspection', 'court'],
  });

  const { data: events = [] } = useCalendarEvents();
  const { data: experts = [] } = useExperts();

  const filteredEvents = filterEvents(events, filters);

  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = view === 'month' ? 1 : view === 'week' ? 1 : 1;
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
    
    setCurrentDate(prev => 
      dayjs(prev)[direction === 'next' ? 'add' : 'subtract'](amount, unit).toDate()
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Календарь</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Создать событие
        </Button>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          {/* Navigation */}
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigateDate('prev')}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {formatDateHeader(currentDate, view)}
            </Typography>
            <IconButton onClick={() => navigateDate('next')}>
              <ChevronRight />
            </IconButton>
            <Button
              startIcon={<Today />}
              onClick={() => setCurrentDate(new Date())}
              size="small"
            >
              Сегодня
            </Button>
          </Box>

          {/* View Selector */}
          <ButtonGroup size="small">
            <Button
              variant={view === 'month' ? 'contained' : 'outlined'}
              onClick={() => setView('month')}
            >
              Месяц
            </Button>
            <Button
              variant={view === 'week' ? 'contained' : 'outlined'}
              onClick={() => setView('week')}
            >
              Неделя
            </Button>
            <Button
              variant={view === 'day' ? 'contained' : 'outlined'}
              onClick={() => setView('day')}
            >
              День
            </Button>
          </ButtonGroup>

          {/* Expert Filter */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Эксперт</InputLabel>
            <Select
              value={filters.expertId || ''}
              label="Эксперт"
              onChange={(e) => setFilters({ ...filters, expertId: e.target.value || undefined })}
            >
              <MenuItem value="">Все эксперты</MenuItem>
              {experts.map((expert) => (
                <MenuItem key={expert.id} value={expert.id}>
                  {expert.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Event Type Filter */}
          <FormGroup row>
            {(['deadline', 'inspection', 'court'] as const).map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={filters.eventTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...filters.eventTypes, type]
                        : filters.eventTypes.filter(t => t !== type);
                      setFilters({ ...filters, eventTypes: newTypes });
                    }}
                  />
                }
                label={getEventTypeLabel(type)}
              />
            ))}
          </FormGroup>
        </Box>
      </Paper>

      {/* Calendar Grid */}
      <CalendarGrid
        currentDate={currentDate}
        view={view}
        events={filteredEvents}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {/* Event Modal */}
      <EventModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
      />
    </Box>
  );
}