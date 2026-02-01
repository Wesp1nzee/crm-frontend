import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Warning,
  CheckCircle,
  Add,
  Gavel,
  People,
  AccountBalance,
  Notifications,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases, useInvoices } from '../shared/hooks/useCases';
import { usePermissions } from '../shared/hooks/usePermissions';
import { ExpertHomePage } from './ExpertHomePage';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface FinancialSummary {
  total_revenue: number;
  pending_payments: number;
  pending_amount: number;
  average_case_cost: number;
  total_cases: number;
  completed_cases: number;
  active_cases: number;
  overdue_cases: number;
}

const fetchFinancialSummary = async (): Promise<FinancialSummary> => {
  const response = await axios.get('/api/cases/financial-summary');
  return response.data;
};

export function HomePage() {
  const { isExpert } = usePermissions();

  if (isExpert) {
    return <ExpertHomePage />;
  }

  return <AdminHomePage />;
}

function AdminHomePage() {
  const navigate = useNavigate();
  const { data: casesResponse } = useCases(); // Получаем весь объект ответа
  const { data: financialSummary, isLoading: isFinancialLoading } = useQuery<FinancialSummary>({
    queryKey: ['financial-summary'],
    queryFn: fetchFinancialSummary,
  });

  // Извлекаем массив дел из объекта ответа
  const cases = casesResponse?.data || []; // Теперь берем из data вместо items
  
  const activeCases = cases.filter(c => c.status === 'in_work'); // Активные - только в работе
  const overdueCases = activeCases.filter(c => dayjs(c.deadline).isBefore(dayjs(), 'day'));
  const recentCases = cases.slice(0, 5);

  // Используем данные из финансовой сводки если они доступны
  const totalRevenue = financialSummary?.total_revenue || 0;
  const pendingPayments = financialSummary?.pending_payments || 0;
  const averageCaseCost = financialSummary?.average_case_cost || 0;

  const completedCases = cases.filter(c => c.status !== 'in_work');
  const completionRate = cases.length ? Math.round((completedCases.length / cases.length) * 100) : 0;

  return (
    <Box sx={{ width: '100%', maxWidth: 'none' }}>
      <Box mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Добро пожаловать в CRM
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {dayjs().format('DD MMMM YYYY')} • Обзор деятельности
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4
        }}
      >
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{activeCases.length}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Активных дел</Typography>
              </Box>
              <Schedule sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{overdueCases.length}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Просрочено</Typography>
              </Box>
              <Warning sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{Math.round(totalRevenue / 1000)}K</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Выручка (₽)</Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{completionRate}%</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Завершено</Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 3
        }}
      >
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">Быстрые действия</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button variant="contained" size="large" startIcon={<Add />} fullWidth onClick={() => navigate('/cases')} sx={{ py: 1.5 }}>
                Новое дело
              </Button>
              <Button variant="outlined" size="large" startIcon={<People />} fullWidth onClick={() => navigate('/clients')} sx={{ py: 1.5 }}>
                Клиенты
              </Button>
              {/* <Button variant="outlined" size="large" startIcon={<AccountBalance />} fullWidth onClick={() => navigate('/finance')} sx={{ py: 1.5 }}>
                Финансы
              </Button> */}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">Прогресс работы</Typography>
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Завершение дел</Typography>
                <Typography variant="body2" fontWeight="bold">{completionRate}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={completionRate} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Активные дела</Typography>
                <Typography variant="body2" fontWeight="bold">{activeCases.length}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min((activeCases.length / 10) * 100, 100)} sx={{ height: 8, borderRadius: 4 }} color="secondary" />
            </Box>
            {pendingPayments > 0 && (
              <Chip icon={<Notifications />} label={`${pendingPayments} ожидают оплаты`} color="warning" variant="outlined" />
            )}
          </CardContent>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">Финансовая сводка</Typography>
            <Box mt={2}>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Общая выручка</Typography>
                <Typography variant="h5" color="success.main">{totalRevenue.toLocaleString()} ₽</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Средняя стоимость дела</Typography>
                <Typography variant="h6">
                  {averageCaseCost.toLocaleString()} ₽
                </Typography>
              </Box>
              {pendingPayments > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Долг</Typography>
                  <Typography variant="h6" color="warning.main">
                    {financialSummary?.pending_amount.toLocaleString()} ₽
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Последние дела</Typography>
            <IconButton onClick={() => navigate('/cases')}><ArrowForward /></IconButton>
          </Box>
          <List>
            {recentCases.map((case_) => (
              <ListItem 
                key={case_.id}
                sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/cases/${case_.id}`)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><Gavel /></Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={case_.case_number}
                  secondary={case_.object_address}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
                <Chip 
                  size="small" 
                  label={dayjs(case_.deadline).format('DD.MM')}
                  color={dayjs(case_.deadline).isBefore(dayjs(), 'day') ? 'error' : 'default'}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}