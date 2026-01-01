import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases } from '../../shared/hooks/useCases';
import type { Case } from '../../entities/case/types';

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
  const { data: cases, isLoading, error } = useCases();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        Ошибка загрузки дел
      </Typography>
    );
  }

  const isOverdue = (deadline: string) => dayjs(deadline).isBefore(dayjs(), 'day');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Дела
      </Typography>
      
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
            {cases?.map((case_) => (
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
    </Box>
  );
}