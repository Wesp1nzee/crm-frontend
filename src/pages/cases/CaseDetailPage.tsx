import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCase, useUpdateCase, useExperts, useAssignCase, useUnassignCase } from '../../shared/hooks/useCases';
import type { Case } from '../../entities/case/types';
import { useState } from 'react';

const statusLabels: Record<Case['status'], string> = {
  new: 'Новое',
  accepted: 'Принято',
  awaiting_documents: 'Ожидание документов',
  inspection: 'Осмотр',
  in_progress: 'В работе',
  on_check: 'На проверке',
  done: 'Выполнено',
  closed: 'Закрыто',
};

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: case_, isLoading, error } = useCase(id!);
  const { data: experts } = useExperts();
  const updateCase = useUpdateCase();
  const assignCase = useAssignCase();
  const unassignCase = useUnassignCase();
  
  const [status, setStatus] = useState<Case['status']>();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !case_) {
    return (
      <Typography color="error" align="center">
        Дело не найдено
      </Typography>
    );
  }

  const handleStatusUpdate = () => {
    if (status && status !== case_.status) {
      updateCase.mutate({ id: case_.id, data: { status } });
    }
  };

  const handleAssignExpert = async () => {
    if (selectedExpertId) {
      await assignCase.mutateAsync({
        caseId: case_.id,
        expertId: selectedExpertId,
        assignedBy: 'Генеральный директор',
        notes: assignmentNotes || undefined,
      });
      setAssignDialogOpen(false);
      setSelectedExpertId('');
      setAssignmentNotes('');
    }
  };

  const handleUnassignExpert = async () => {
    if (confirm('Отменить назначение эксперта?')) {
      await unassignCase.mutateAsync(case_.id);
    }
  };

  const assignedExpert = experts?.find(e => e.id === case_.assignedExpertId);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Дело {case_.caseNumber}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Основная информация
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Суд
              </Typography>
              <Typography variant="body1">{case_.authority}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Тип экспертизы
              </Typography>
              <Typography variant="body1">{case_.caseType}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Объект
              </Typography>
              <Typography variant="body1">{case_.objectType}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Адрес
              </Typography>
              <Typography variant="body1">{case_.objectAddress}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Статус и сроки
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={status || case_.status}
                  label="Статус"
                  onChange={(e) => setStatus(e.target.value as Case['status'])}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {status && status !== case_.status && (
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={handleStatusUpdate}
                  disabled={updateCase.isPending}
                >
                  Сохранить
                </Button>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Назначенный эксперт
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {assignedExpert ? (
                  <>
                    <Typography variant="body1">{assignedExpert.name}</Typography>
                    <Button size="small" color="error" onClick={handleUnassignExpert}>
                      Отменить
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    Назначить эксперта
                  </Button>
                )}
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Дата начала
              </Typography>
              <Typography variant="body1">
                {dayjs(case_.startDate).format('DD.MM.YYYY')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Срок выполнения
              </Typography>
              <Typography 
                variant="body1"
                color={dayjs(case_.deadline).isBefore(dayjs(), 'day') ? 'error' : 'inherit'}
              >
                {dayjs(case_.deadline).format('DD.MM.YYYY')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Стоимость
              </Typography>
              <Typography variant="body1">
                {case_.cost.toLocaleString()} ₽
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Диалог назначения эксперта */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить эксперта</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Эксперт</InputLabel>
              <Select
                value={selectedExpertId}
                label="Эксперт"
                onChange={(e) => setSelectedExpertId(e.target.value)}
              >
                {experts?.filter(e => e.status === 'active').map((expert) => (
                  <MenuItem key={expert.id} value={expert.id}>
                    {expert.name} ({expert.specialization.join(', ')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Примечание"
              multiline
              rows={3}
              fullWidth
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleAssignExpert}
            variant="contained"
            disabled={!selectedExpertId || assignCase.isPending}
          >
            Назначить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}