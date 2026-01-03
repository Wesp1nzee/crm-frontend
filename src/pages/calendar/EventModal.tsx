import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEventColor, getEventTypeLabel } from '../../shared/utils/calendar';
import type { CalendarEvent } from '../../entities/calendar/types';

interface EventModalProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventModal({ event, open, onClose }: EventModalProps) {
  const navigate = useNavigate();

  if (!event) return null;

  const handleGoToCase = () => {
    navigate(`/cases/${event.caseId}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={getEventTypeLabel(event.type)}
            sx={{
              bgcolor: getEventColor(event.type),
              color: 'white',
            }}
          />
          <Typography variant="h6">{event.title}</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Дело
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {event.caseNumber}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Адрес объекта
            </Typography>
            <Typography variant="body1">
              {event.objectAddress}
            </Typography>
          </Box>
          
          {event.expertName && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Ответственный эксперт
              </Typography>
              <Typography variant="body1">
                {event.expertName}
              </Typography>
            </Box>
          )}
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Дата и время
            </Typography>
            <Typography variant="body1">
              {dayjs(event.date).format('DD MMMM YYYY')}
              {event.time && ` в ${event.time}`}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Закрыть
        </Button>
        <Button variant="contained" onClick={handleGoToCase}>
          Перейти в дело
        </Button>
      </DialogActions>
    </Dialog>
  );
}