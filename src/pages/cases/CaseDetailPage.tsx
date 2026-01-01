import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCase, useUpdateCase } from '../../shared/hooks/useCases';
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
  const updateCase = useUpdateCase();
  const [status, setStatus] = useState<Case['status']>();

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
    </Box>
  );
}