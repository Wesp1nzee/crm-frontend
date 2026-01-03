import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Popover,
  Paper,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import { format, addDays, subDays, isToday, startOfDay, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  objectAddress: string;
  expertName: string;
  inspectionDate: string;
  inspectionEndDate: string;
  status: 'inspection' | 'deadline' | 'court';
}

const mockCases: Case[] = [
  {
    id: '1',
    caseNumber: 'ЭКС-2024-001',
    title: 'Осмотр жилого здания',
    objectAddress: 'г. Москва, ул. Тверская, д. 1',
    expertName: 'Петров П.П.',
    inspectionDate: `${format(new Date(), 'yyyy-MM-dd')}T10:00:00`,
    inspectionEndDate: `${format(new Date(), 'yyyy-MM-dd')}T12:00:00`,
    status: 'inspection',
  },
  {
    id: '2',
    caseNumber: 'ЭКС-2024-002',
    title: 'Срок подачи документов',
    objectAddress: 'г. Москва, Красная площадь, д. 1',
    expertName: 'Сидорова А.И.',
    inspectionDate: `${format(new Date(), 'yyyy-MM-dd')}T14:30:00`,
    inspectionEndDate: `${format(new Date(), 'yyyy-MM-dd')}T15:00:00`,
    status: 'deadline',
  },
  {
    id: '3',
    caseNumber: 'ЭКС-2024-003',
    title: 'Судебное заседание',
    objectAddress: 'МО, г. Подольск, ул. Промышленная, д. 15',
    expertName: 'Петров П.П.',
    inspectionDate: `${format(new Date(), 'yyyy-MM-dd')}T16:00:00`,
    inspectionEndDate: `${format(new Date(), 'yyyy-MM-dd')}T17:30:00`,
    status: 'court',
  },
];

const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 22;

const getEventColor = (status: Case['status']) => {
  switch (status) {
    case 'inspection': return '#1976d2';
    case 'deadline': return '#d32f2f';
    case 'court': return '#2e7d32';
    default: return '#757575';
  }
};

const calculateEventPosition = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const baseMinutes = START_HOUR * 60;
  
  const top = ((startMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
  
  return { top, height };
};

const getCurrentTimePosition = () => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const baseMinutes = START_HOUR * 60;
  return ((minutes - baseMinutes) / 60) * HOUR_HEIGHT;
};

export function DailyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTimePosition, setCurrentTimePosition] = useState(getCurrentTimePosition());
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePosition(getCurrentTimePosition());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayCases = mockCases.filter(case_ => 
    format(new Date(case_.inspectionDate), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
  );

  const handleGridClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const hour = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
      const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60);
      console.log(`Clicked time: ${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  };

  const handleEventClick = (e: React.MouseEvent, case_: Case) => {
    e.stopPropagation();
    setSelectedCase(case_);
    setPopoverAnchor(e.currentTarget as HTMLElement);
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => setCurrentDate(subDays(currentDate, 1))}>
            <ChevronLeft />
          </IconButton>
          <IconButton onClick={() => setCurrentDate(addDays(currentDate, 1))}>
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
        <Typography variant="h6">
          {format(currentDate, 'd MMMM, EEEE', { locale: ru })}
        </Typography>
      </Box>

      {/* Calendar Grid */}
      <Box display="flex" sx={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 20 }}>
        {/* Time Column */}
        <Box sx={{ width: 60, flexShrink: 0 }}>
          {hours.map(hour => (
            <Box
              key={hour}
              sx={{
                height: HOUR_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                pr: 1,
                pt: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hour.toString().padStart(2, '0')}:00
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Main Grid */}
        <Box
          ref={gridRef}
          onClick={handleGridClick}
          sx={{
            flex: 1,
            position: 'relative',
            borderLeft: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
          }}
        >
          {/* Hour Lines */}
          {hours.map((hour, index) => (
            <Box
              key={hour}
              sx={{
                position: 'absolute',
                top: index * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: 1,
                bgcolor: 'divider',
              }}
            />
          ))}

          {/* Current Time Indicator */}
          {isToday(currentDate) && (
            <Box
              sx={{
                position: 'absolute',
                top: currentTimePosition,
                left: -6,
                right: 0,
                height: 2,
                bgcolor: 'error.main',
                zIndex: 10,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -4,
                  top: -4,
                  width: 10,
                  height: 10,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                },
              }}
            />
          )}

          {/* Events */}
          {todayCases.map(case_ => {
            const { top, height } = calculateEventPosition(case_.inspectionDate, case_.inspectionEndDate);
            return (
              <Box
                key={case_.id}
                onClick={(e) => handleEventClick(e, case_)}
                sx={{
                  position: 'absolute',
                  top,
                  left: 8,
                  right: 8,
                  height,
                  bgcolor: 'background.paper',
                  border: `3px solid ${getEventColor(case_.status)}`,
                  borderRadius: 1,
                  p: 1,
                  cursor: 'pointer',
                  boxShadow: 1,
                  zIndex: 5,
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {case_.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {format(new Date(case_.inspectionDate), 'HH:mm')} - {format(new Date(case_.inspectionEndDate), 'HH:mm')}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Event Popover */}
      <Popover
        open={!!popoverAnchor}
        anchorEl={popoverAnchor}
        onClose={() => {
          setPopoverAnchor(null);
          setSelectedCase(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {selectedCase && (
          <Paper sx={{ p: 2, minWidth: 250 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {selectedCase.caseNumber}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Адрес:</strong> {selectedCase.objectAddress}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Эксперт:</strong> {selectedCase.expertName}
            </Typography>
            <Typography variant="body2">
              <strong>Время:</strong> {format(new Date(selectedCase.inspectionDate), 'HH:mm')} - {format(new Date(selectedCase.inspectionEndDate), 'HH:mm')}
            </Typography>
          </Paper>
        )}
      </Popover>
    </Box>
  );
}