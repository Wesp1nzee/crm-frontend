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
  Tooltip,
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
    assignedExpertId: '',
    plaintiff: '', // Истец
    defendant: '', // Ответчик
    depositAmount: 0, // Депозит
    cashAmount: 0, // Наличные
    bankTransferAmount: 0, // Безнал
    remainingDebt: 0, // Остаток долга
    completionDate: '', // Окончена
    expertNotes: '', // Роспись эксперта
    archiveStatus: '', // Архив
    remarks: '', // Примечание
  });

  const handleSubmit = async () => {
    try {
      const newCase = await createCase.mutateAsync({
        ...formData,
        status: 'new' as Case['status'],
        startDate: new Date(formData.startDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
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
  const formatDate = (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-';
  const formatCurrency = (value: number) => value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
  
  const filteredCases = expertFilter 
    ? cases?.filter(c => c.assignedExpertId === expertFilter)
    : cases;
    
  const expertName = expertFilter 
    ? experts?.find(e => e.id === expertFilter)?.name
    : null;

  // Функция для получения имени клиента по ID
  const getClientName = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    return client ? client.name : 'Не указан';
  };

  // Функция для получения имени эксперта по ID
  const getExpertName = (expertId: string) => {
    const expert = experts?.find(e => e.id === expertId);
    return expert ? expert.name : 'Не назначен';
  };

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
        <Table
          sx={{
            '& .MuiTableCell-root': {
              border: '1px solid rgba(224, 224, 224, 1)', // Восстанавливаем границы
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Статус</TableCell>
              <TableCell>№ п/п</TableCell>
              <TableCell>№</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Вид</TableCell>
              <TableCell>Заказчик/суд</TableCell>
              <TableCell>Судья</TableCell>
              <TableCell>Истец</TableCell>
              <TableCell>Ответчик</TableCell>
              <TableCell>№ дела</TableCell>
              <TableCell>Стоим.</TableCell>
              <TableCell>Безнал</TableCell>
              <TableCell>Наличные</TableCell>
              <TableCell>Остаток долга</TableCell>
              <TableCell>Срок установленный судом/договором</TableCell>
              <TableCell>Окончена</TableCell>
              <TableCell>Роспись эксперта</TableCell>
              <TableCell>Архив</TableCell>
              <TableCell>Примечание</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases?.map((case_, index) => (
              <TableRow
                key={case_.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/cases/${case_.id}`)}
              >
                <TableCell>
                  <Chip
                    label={statusLabels[case_.status]}
                    color={statusColors[case_.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{case_.caseNumber || '-'}</TableCell>
                <TableCell>{formatDate(case_.startDate)}</TableCell>
                <TableCell>{case_.caseType || '-'}</TableCell>
                <TableCell>{getClientName(case_.clientId)}</TableCell>
                <TableCell>{case_.authority || '-'}</TableCell>
                <TableCell>
                  <Tooltip title={case_.plaintiff || 'Не указан'}>
                    <span>{case_.plaintiff || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={case_.defendant || 'Не указан'}>
                    <span>{case_.defendant || '-'}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{case_.caseNumber || '-'}</TableCell>
                <TableCell>{formatCurrency(case_.cost)}</TableCell>
                <TableCell>{formatCurrency(case_.bankTransferAmount || 0)}</TableCell>
                <TableCell>{formatCurrency(case_.cashAmount || 0)}</TableCell>
                <TableCell>{formatCurrency(case_.remainingDebt || 0)}</TableCell>
                <TableCell>
                  <Typography
                    color={isOverdue(case_.deadline) ? 'error' : 'inherit'}
                    fontWeight={isOverdue(case_.deadline) ? 'bold' : 'normal'}
                  >
                    {formatDate(case_.deadline)}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(case_.completionDate)}</TableCell>
                <TableCell>{case_.expertNotes || '-'}</TableCell>
                <TableCell>{case_.archiveStatus || '-'}</TableCell>
                <TableCell>{case_.remarks || '-'}</TableCell>
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
            <TextField
              label="Истец"
              fullWidth
              value={formData.plaintiff}
              onChange={(e) => setFormData({ ...formData, plaintiff: e.target.value })}
            />
            <TextField
              label="Ответчик"
              fullWidth
              value={formData.defendant}
              onChange={(e) => setFormData({ ...formData, defendant: e.target.value })}
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
            <TextField
              label="Депозит (Безнал, ₽)"
              type="number"
              fullWidth
              value={formData.bankTransferAmount}
              onChange={(e) => setFormData({ ...formData, bankTransferAmount: Number(e.target.value) })}
            />
            <TextField
              label="Депозит (Наличные, ₽)"
              type="number"
              fullWidth
              value={formData.cashAmount}
              onChange={(e) => setFormData({ ...formData, cashAmount: Number(e.target.value) })}
            />
            <TextField
              label="Остаток долга (₽)"
              type="number"
              fullWidth
              value={formData.remainingDebt}
              onChange={(e) => setFormData({ ...formData, remainingDebt: Number(e.target.value) })}
            />
            <TextField
              label="Окончена (дата)"
              type="date"
              fullWidth
              value={formData.completionDate}
              onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Роспись эксперта"
              fullWidth
              value={formData.expertNotes}
              onChange={(e) => setFormData({ ...formData, expertNotes: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Архив</InputLabel>
              <Select
                value={formData.archiveStatus}
                label="Архив"
                onChange={(e) => setFormData({ ...formData, archiveStatus: e.target.value })}
              >
                <MenuItem value="">Не архивировано</MenuItem>
                <MenuItem value="archived">Архивировано</MenuItem>
                <MenuItem value="pending">На утверждении</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Примечание"
              multiline
              rows={3}
              fullWidth
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Эксперт (необязательно)</InputLabel>
              <Select
                value={formData.assignedExpertId}
                label="Эксперт (необязательно)"
                onChange={(e) => setFormData({ ...formData, assignedExpertId: e.target.value })}
              >
                <MenuItem value="">Без назначения</MenuItem>
                {experts?.filter(e => e.status === 'active').map((expert) => (
                  <MenuItem key={expert.id} value={expert.id}>
                    {expert.name} ({expert.specialization.join(', ')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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