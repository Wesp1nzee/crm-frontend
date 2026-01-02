import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
} from '@mui/icons-material';
import { useCases, useClients, useCreateCase, useExperts } from '../../shared/hooks/useCases';
import type { Case } from '../../entities/case/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

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

const statusColors: Record<Case['status'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  new: 'default',
  accepted: 'info',
  awaiting_documents: 'warning',
  inspection: 'primary',
  in_progress: 'primary',
  on_check: 'secondary',
  done: 'success',
  closed: 'default',
};

export function CaseListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expertFilter = searchParams.get('expert');
  
  const { data: cases, isLoading, error } = useCases();
  const { data: clients } = useClients();
  const { data: experts } = useExperts();
  const createCase = useCreateCase();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    caseNumber: '',
    authority: '',
    clientId: '',
    caseType: '',
    objectType: '',
    objectAddress: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    cost: 0,
  });

  const handleSubmit = async () => {
    try {
      const newCase = await createCase.mutateAsync({
        ...formData,
        status: 'new' as Case['status'],
        startDate: new Date(formData.startDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
      });
      setDialogOpen(false);
      navigate(`/cases/${newCase.id}`);
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки дел
      </Alert>
    );
  }

  const isOverdue = (deadline: string) => dayjs(deadline).isBefore(dayjs(), 'day');
  
  const filteredCases = expertFilter 
    ? cases?.filter(c => c.assignedExpertId === expertFilter)
    : cases;
    
  const expertName = expertFilter 
    ? experts?.find(e => e.id === expertFilter)?.name
    : null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">
            Дела {expertName && `- ${expertName}`}
          </Typography>
          {expertFilter && (
            <Button 
              size="small" 
              onClick={() => navigate('/cases')}
              sx={{ mt: 1 }}
            >
              Показать все дела
            </Button>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Создать дело
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Номер дела</TableCell>
              <TableCell>Суд</TableCell>
              <TableCell>Тип экспертизы</TableCell>
              <TableCell>Объект</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Срок</TableCell>
              <TableCell>Стоимость</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases?.map((case_) => (
              <TableRow
                key={case_.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/cases/${case_.id}`)}
              >
                <TableCell>{case_.caseNumber}</TableCell>
                <TableCell>{case_.authority}</TableCell>
                <TableCell>{case_.caseType}</TableCell>
                <TableCell>{case_.objectAddress}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[case_.status]}
                    color={statusColors[case_.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    color={isOverdue(case_.deadline) ? 'error' : 'inherit'}
                    fontWeight={isOverdue(case_.deadline) ? 'bold' : 'normal'}
                  >
                    {dayjs(case_.deadline).format('DD.MM.YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>{case_.cost.toLocaleString()} ₽</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создать новое дело</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Номер дела"
              fullWidth
              value={formData.caseNumber}
              onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
            />
            <TextField
              label="Суд/Орган"
              fullWidth
              value={formData.authority}
              onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Клиент</InputLabel>
              <Select
                value={formData.clientId}
                label="Клиент"
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                {clients?.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Тип экспертизы"
              fullWidth
              value={formData.caseType}
              onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
            />
            <TextField
              label="Тип объекта"
              fullWidth
              value={formData.objectType}
              onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
            />
            <TextField
              label="Адрес объекта"
              fullWidth
              value={formData.objectAddress}
              onChange={(e) => setFormData({ ...formData, objectAddress: e.target.value })}
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Дата начала"
                type="date"
                fullWidth
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Срок выполнения"
                type="date"
                fullWidth
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Стоимость (₽)"
              type="number"
              fullWidth
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createCase.isPending}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}