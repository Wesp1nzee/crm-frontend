import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import dayjs from 'dayjs';
import { useCreateCalendarEvent } from '../../shared/hooks/useCalendar';
import { useCases, useExperts } from '../../shared/hooks/useCases';
import { getEventTypeLabel } from '../../shared/utils/calendar';
import type { CalendarEvent } from '../../entities/calendar/types';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
}

export function CreateEventDialog({ open, onClose, selectedDate }: CreateEventDialogProps) {
  const [formData, setFormData] = useState({
    type: 'inspection' as CalendarEvent['type'],
    title: '',
    date: selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    time: '10:00',
    caseId: '',
  });

  const { data: cases = [] } = useCases();
  const { data: experts = [] } = useExperts();
  const createEvent = useCreateCalendarEvent();

  const handleSubmit = async () => {
    const selectedCase = cases.find(c => c.id === formData.caseId);
    const expert = experts.find(e => e.id === selectedCase?.assignedExpertId);
    
    await createEvent.mutateAsync({
      type: formData.type,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      caseId: formData.caseId,
      caseNumber: selectedCase?.caseNumber || '',
      objectAddress: selectedCase?.objectAddress || '',
      expertId: expert?.id,
      expertName: expert?.name,
    });
    
    onClose();
    setFormData({
      type: 'inspection',
      title: '',
      date: dayjs().format('YYYY-MM-DD'),
      time: '10:00',
      caseId: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Создать событие</DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Тип события</InputLabel>
            <Select
              value={formData.type}
              label="Тип события"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
            >
              {(['deadline', 'inspection', 'court'] as const).map((type) => (
                <MenuItem key={type} value={type}>
                  {getEventTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Название события"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          
          <FormControl fullWidth>
            <InputLabel>Дело</InputLabel>
            <Select
              value={formData.caseId}
              label="Дело"
              onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
            >
              {cases.map((case_) => (
                <MenuItem key={case_.id} value={case_.id}>
                  {case_.caseNumber} - {case_.objectAddress}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box display="flex" gap={2}>
            <TextField
              label="Дата"
              type="date"
              fullWidth
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Время"
              type="time"
              fullWidth
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.title || !formData.caseId || createEvent.isPending}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}