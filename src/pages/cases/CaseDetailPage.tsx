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
} from '@mui/material';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCase, useUpdateCase } from '../../shared/hooks/useCases';
import type { Case, CaseStatus } from '../../entities/case/types';
import { useState } from 'react';

const statusLabels: Record<CaseStatus, string> = {
  archive: 'Архив',
  in_work: 'В работе',
  debt: 'Долг',
  executed: 'Выполнено',
  withdrawn: 'Отозвано',
  cancelled: 'Отменено',
  fssp: 'ФССП',
};

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: case_, isLoading, error } = useCase(id!);
  const updateCase = useUpdateCase();
  
  const [status, setStatus] = useState<CaseStatus>();

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
        Дело {case_.case_number}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Основная информация
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                № п/п
              </Typography>
              <Typography variant="body1">{case_.number}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Суд/Орган
              </Typography>
              <Typography variant="body1">{case_.authority}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Тип экспертизы
              </Typography>
              <Typography variant="body1">{case_.case_type}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Объект
              </Typography>
              <Typography variant="body1">{case_.object_type}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Адрес
              </Typography>
              <Typography variant="body1">{case_.object_address}</Typography>
            </Box>
            {case_.plaintiff && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Истец
                </Typography>
                <Typography variant="body1">{case_.plaintiff}</Typography>
              </Box>
            )}
            {case_.defendant && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ответчик
                </Typography>
                <Typography variant="body1">{case_.defendant}</Typography>
              </Box>
            )}
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
                  onChange={(e) => setStatus(e.target.value as CaseStatus)}
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
                {dayjs(case_.start_date).format('DD.MM.YYYY')}
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
            {case_.completion_date && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Дата завершения
                </Typography>
                <Typography variant="body1">
                  {dayjs(case_.completion_date).format('DD.MM.YYYY')}
                </Typography>
              </Box>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Стоимость
              </Typography>
              <Typography variant="body1">
                {case_.cost.toLocaleString()} ₽
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Безнал / Наличные
              </Typography>
              <Typography variant="body1">
                {case_.bank_transfer_amount.toLocaleString()} ₽ / {case_.cash_amount.toLocaleString()} ₽
              </Typography>
            </Box>
            {case_.remaining_debt > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Остаток долга
                </Typography>
                <Typography variant="body1" color="warning.main">
                  {case_.remaining_debt.toLocaleString()} ₽
                </Typography>
              </Box>
            )}
            {case_.remarks && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Примечание
                </Typography>
                <Typography variant="body1">{case_.remarks}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}