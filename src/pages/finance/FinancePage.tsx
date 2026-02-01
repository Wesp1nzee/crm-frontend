import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Receipt,
  Warning,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useInvoices, usePayments, useCases } from '../../shared/hooks/useCases';
import type { Invoice } from '../../entities/case/types';

const invoiceStatusLabels: Record<Invoice['status'], string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  paid: 'Оплачен',
  overdue: 'Просрочен',
  cancelled: 'Отменен',
};

const invoiceStatusColors: Record<Invoice['status'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  overdue: 'error',
  cancelled: 'secondary',
};

export function FinancePage() {
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all');
  
  const {  invoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  const {  payments, isLoading: paymentsLoading } = usePayments();
  const {  cases } = useCases();

  const filteredInvoices = invoices?.filter(invoice => 
    filterStatus === 'all' || invoice.status === filterStatus
  );

  // Проверяем, что cases - это массив, иначе используем пустой массив
  const casesArray = Array.isArray(cases) ? cases : [];

  const getCaseName = (caseId: string) => {
    const caseItem = casesArray.find(c => c.id === caseId);
    return caseItem?.caseNumber || caseId;
  };

  // Получаем имя клиента напрямую из данных дела
  const getClientName = (caseId: string) => {
    const caseItem = casesArray.find(c => c.id === caseId);
    return caseItem?.clientName || caseItem?.client?.name || '-';
  };

  // Аналитика
  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) || 0;
  const pendingAmount = invoices?.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0) || 0;
  const overdueCount = invoices?.filter(i => i.status === 'overdue').length || 0;
  const thisMonthRevenue = payments?.filter(p => 
    dayjs(p.receivedAt).isAfter(dayjs().startOf('month'))
  ).reduce((sum, p) => sum + p.amount, 0) || 0;

  if (invoicesLoading || paymentsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (invoicesError) {
    return (
      <Alert severity="error">
        Ошибка загрузки финансовых данных
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Финансы
      </Typography>

      {/* Карточки с метриками */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Общая выручка
                  </Typography>
                  <Typography variant="h5">
                    {totalRevenue.toLocaleString()} ₽
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    К оплате
                  </Typography>
                  <Typography variant="h5">
                    {pendingAmount.toLocaleString()} ₽
                  </Typography>
                </Box>
                <AccountBalance color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    За этот месяц
                  </Typography>
                  <Typography variant="h5">
                    {thisMonthRevenue.toLocaleString()} ₽
                  </Typography>
                </Box>
                <Receipt color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Просрочено
                  </Typography>
                  <Typography variant="h5" color="error">
                    {overdueCount}
                  </Typography>
                </Box>
                <Warning color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Статус счета</InputLabel>
            <Select
              value={filterStatus}
              label="Статус счета"
              onChange={(e) => setFilterStatus(e.target.value as Invoice['status'] | 'all')}
            >
              <MenuItem value="all">Все статусы</MenuItem>
              {Object.entries(invoiceStatusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button variant="contained" color="primary">
            Создать счет
          </Button>
        </Box>
      </Paper>

      {/* Таблица счетов */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Номер счета</TableCell>
              <TableCell>Дело</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Сумма</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell>К оплате до</TableCell>
              <TableCell>Оплачен</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices?.map((invoice) => (
              <TableRow key={invoice.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {invoice.number}
                  </Typography>
                </TableCell>
                <TableCell>{getCaseName(invoice.caseId)}</TableCell>
                <TableCell>{getClientName(invoice.caseId)}</TableCell>
                <TableCell>
                  <Typography fontWeight="medium">
                    {invoice.amount.toLocaleString()} ₽
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={invoiceStatusLabels[invoice.status]}
                    color={invoiceStatusColors[invoice.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {dayjs(invoice.createdAt).format('DD.MM.YYYY')}
                </TableCell>
                <TableCell>
                  <Typography
                    color={invoice.status === 'overdue' ? 'error' : 'inherit'}
                    fontWeight={invoice.status === 'overdue' ? 'bold' : 'normal'}
                  >
                    {dayjs(invoice.dueDate).format('DD.MM.YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  {invoice.paidAt ? dayjs(invoice.paidAt).format('DD.MM.YYYY') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}