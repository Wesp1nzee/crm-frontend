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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  PieChart,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useCases, useClients, useInvoices } from '../../shared/hooks/useCases';
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

export function ReportsPage() {
  const { data: cases, isLoading: casesLoading } = useCases();
  const { data: clients } = useClients();
  const { data: invoices } = useInvoices();

  if (casesLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Аналитика
  const totalCases = cases?.length || 0;
  const activeCases = cases?.filter(c => !['done', 'closed'].includes(c.status)).length || 0;
  const completedCases = cases?.filter(c => ['done', 'closed'].includes(c.status)).length || 0;
  const overdueCases = cases?.filter(c => 
    !['done', 'closed'].includes(c.status) && dayjs(c.deadline).isBefore(dayjs(), 'day')
  ).length || 0;

  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) || 0;
  const avgCaseValue = totalCases > 0 ? Math.round(totalRevenue / completedCases) : 0;

  // Статистика по статусам
  const statusStats = Object.keys(statusLabels).map(status => {
    const count = cases?.filter(c => c.status === status).length || 0;
    return {
      status: status as Case['status'],
      count,
      percentage: totalCases > 0 ? Math.round((count / totalCases) * 100) : 0,
    };
  }).filter(s => s.count > 0);

  // Статистика по типам экспертиз
  const caseTypeStats = cases?.reduce((acc, case_) => {
    acc[case_.caseType] = (acc[case_.caseType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Топ клиенты
  const clientStats = clients?.map(client => {
    const clientCases = cases?.filter(c => c.clientId === client.id) || [];
    const revenue = clientCases.reduce((sum, c) => {
      const invoice = invoices?.find(i => i.caseId === c.id && i.status === 'paid');
      return sum + (invoice?.amount || 0);
    }, 0);
    return {
      ...client,
      casesCount: clientCases.length,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Отчеты и аналитика
      </Typography>

      {/* Основные метрики */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Всего дел
                  </Typography>
                  <Typography variant="h4">
                    {totalCases}
                  </Typography>
                </Box>
                <BarChart color="primary" sx={{ fontSize: 40 }} />
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
                    Активные дела
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {activeCases}
                  </Typography>
                </Box>
                <Schedule color="primary" sx={{ fontSize: 40 }} />
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
                    Завершено
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {completedCases}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
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
                  <Typography variant="h4" color="error">
                    {overdueCases}
                  </Typography>
                </Box>
                <Warning color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Статистика по статусам */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Распределение по статусам
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Количество</TableCell>
                    <TableCell align="right">%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statusStats.map((stat) => (
                    <TableRow key={stat.status}>
                      <TableCell>
                        <Chip
                          label={statusLabels[stat.status]}
                          color={statusColors[stat.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{stat.count}</TableCell>
                      <TableCell align="right">{stat.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Типы экспертиз */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Типы экспертиз
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Тип экспертизы</TableCell>
                    <TableCell align="right">Количество</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(caseTypeStats)
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Финансовые показатели */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Финансовые показатели
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Общая выручка
              </Typography>
              <Typography variant="h5" color="success.main">
                {totalRevenue.toLocaleString()} ₽
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Средняя стоимость дела
              </Typography>
              <Typography variant="h6">
                {avgCaseValue.toLocaleString()} ₽
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Завершенных дел
              </Typography>
              <Typography variant="h6">
                {completedCases}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Топ клиенты */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Топ клиенты по выручке
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Клиент</TableCell>
                    <TableCell align="right">Дел</TableCell>
                    <TableCell align="right">Выручка</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientStats.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {client.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{client.casesCount}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {client.revenue.toLocaleString()} ₽
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}