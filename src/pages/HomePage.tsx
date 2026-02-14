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
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Warning,
  CheckCircle,
  Add,
  Gavel,
  People,
  ArrowForward,
  AutoGraph,
  DonutLarge,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases } from '../shared/hooks/useCases';
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

const palette = {
  deepSlate: '#F3F7FF',
  deepSlateLight: '#E8F0FF',
  cyberBlue: '#2A7FFF',
  cyberBlueGlow: '#63A4FF',
  softChalk: '#1B2A44',
};

const fetchFinancialSummary = async (): Promise<FinancialSummary> => {
  const response = await axios.get('/api/cases/financial-summary');
  return response.data;
};

const glassCardSx = {
  borderRadius: 6,
  backdropFilter: 'blur(18px)',
  background: `linear-gradient(145deg, ${alpha('#FFFFFF', 0.88)} 0%, ${alpha('#F7FAFF', 0.7)} 100%)`,
  border: `1px solid ${alpha('#A9C2EA', 0.45)}`,
  boxShadow: `0 18px 40px ${alpha('#6785B5', 0.16)}`,
};

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return `${value}`;
}

export function HomePage() {
  const { isExpert } = usePermissions();

  if (isExpert) {
    return <ExpertHomePage />;
  }

  return <AdminHomePage />;
}

function AdminHomePage() {
  const navigate = useNavigate();
  const { data: casesResponse } = useCases();
  const { data: financialSummary } = useQuery<FinancialSummary>({
    queryKey: ['financial-summary'],
    queryFn: fetchFinancialSummary,
  });

  const cases = casesResponse?.data || [];
  const activeCases = cases.filter((caseItem) => caseItem.status === 'in_work');
  const overdueCases = activeCases.filter((caseItem) => dayjs(caseItem.deadline).isBefore(dayjs(), 'day'));
  const recentCases = cases.slice(0, 5);

  const totalRevenue = financialSummary?.total_revenue || 0;
  const pendingPayments = financialSummary?.pending_payments || 0;
  const averageCaseCost = financialSummary?.average_case_cost || 0;

  const completedCases = cases.filter((caseItem) => caseItem.status !== 'in_work');
  const completionRate = cases.length ? Math.round((completedCases.length / cases.length) * 100) : 0;

  return (
    <Box
      sx={{
        width: '100%',
        color: palette.softChalk,
        borderRadius: 8,
        p: { xs: 2, md: 4 },
        background: `radial-gradient(circle at 15% 15%, ${alpha(palette.cyberBlueGlow, 0.18)} 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, ${alpha('#7E8FFF', 0.12)} 0%, transparent 35%),
          linear-gradient(145deg, ${palette.deepSlate} 0%, ${palette.deepSlateLight} 55%, #DDE8FD 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(120deg, ${alpha('#FFFFFF', 0.45)} 0%, transparent 60%)`,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
            Главная панель CRM
          </Typography>
          <Typography variant="h6" sx={{ color: alpha(palette.softChalk, 0.7) }}>
            {dayjs().format('DD MMMM YYYY')} • Премиальный обзор бизнеса
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, minmax(0, 1fr))' },
            gap: 2.5,
          }}
        >
          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 3' } }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.72) }}>Активные дела</Typography>
              <Box mt={1.2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" fontWeight={700}>{activeCases.length}</Typography>
                <Schedule sx={{ fontSize: 42, color: palette.cyberBlueGlow }} />
              </Box>
              <Typography variant="caption" sx={{ color: alpha(palette.softChalk, 0.68) }}>
                В работе прямо сейчас
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 3' } }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.72) }}>Просроченные дедлайны</Typography>
              <Box mt={1.2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" fontWeight={700}>{overdueCases.length}</Typography>
                <Warning sx={{ fontSize: 42, color: '#DF6E5B' }} />
              </Box>
              <Typography variant="caption" sx={{ color: alpha(palette.softChalk, 0.68) }}>
                Требуют немедленного внимания
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 3' } }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.72) }}>Оборот</Typography>
              <Box mt={1.2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" fontWeight={700}>{formatCompactCurrency(totalRevenue)}₽</Typography>
                <TrendingUp sx={{ fontSize: 42, color: '#83D7FF' }} />
              </Box>
              <Typography variant="caption" sx={{ color: alpha(palette.softChalk, 0.68) }}>
                Суммарная выручка системы
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 3' } }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.72) }}>Завершено</Typography>
              <Box mt={1.2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" fontWeight={700}>{completionRate}%</Typography>
                <CheckCircle sx={{ fontSize: 42, color: '#2D9B6A' }} />
              </Box>
              <Typography variant="caption" sx={{ color: alpha(palette.softChalk, 0.68) }}>
                Конверсия дел в завершение
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 5' }, minHeight: 280 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Быстрые действия</Typography>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.68), mb: 2 }}>
                Контролируйте pipeline в пару кликов
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/cases')}
                  sx={{
                    borderRadius: 4,
                    py: 1.4,
                    textTransform: 'none',
                    bgcolor: palette.cyberBlue,
                    boxShadow: `0 10px 30px ${alpha(palette.cyberBlue, 0.5)}`,
                    '&:hover': { bgcolor: '#3A8BFF' },
                  }}
                >
                  Запустить новое дело
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<People />}
                  onClick={() => navigate('/clients')}
                  sx={{
                    borderRadius: 4,
                    py: 1.4,
                    textTransform: 'none',
                    color: palette.softChalk,
                    borderColor: alpha(palette.softChalk, 0.35),
                    '&:hover': { borderColor: alpha(palette.softChalk, 0.6), bgcolor: alpha('#2A7FFF', 0.04) },
                  }}
                >
                  Управление клиентами
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 4' }, minHeight: 280 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <DonutLarge sx={{ color: palette.cyberBlueGlow }} />
                <Typography variant="h6" fontWeight={700}>Эффективность</Typography>
              </Box>
              <Box mb={2.5}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.75) }}>Выполнение по делам</Typography>
                  <Typography variant="body2" fontWeight={600}>{completionRate}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  sx={{
                    height: 10,
                    borderRadius: 12,
                    bgcolor: alpha('#FFFFFF', 0.14),
                    '& .MuiLinearProgress-bar': { bgcolor: '#92F5CC', borderRadius: 12 },
                  }}
                />
              </Box>
              {pendingPayments > 0 && (
                <Chip
                  label={`${pendingPayments} ожидают оплаты`}
                  sx={{
                    color: palette.softChalk,
                    bgcolor: alpha('#FFBA7A', 0.28),
                    border: `1px solid ${alpha('#C88B39', 0.35)}`,
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 3' }, minHeight: 280 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AutoGraph sx={{ color: '#83D7FF' }} />
                <Typography variant="h6" fontWeight={700}>Финансовая сводка</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.68) }}>Средняя стоимость дела</Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>{averageCaseCost.toLocaleString()} ₽</Typography>
              <Divider sx={{ my: 1.8, borderColor: alpha('#FFFFFF', 0.15) }} />
              <Typography variant="body2" sx={{ color: alpha(palette.softChalk, 0.68) }}>Потенциальный долг</Typography>
              <Typography variant="h5" fontWeight={700} color="#FFB6A9" mt={0.5}>
                {(financialSummary?.pending_amount || 0).toLocaleString()} ₽
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ ...glassCardSx, gridColumn: { xs: 'span 1', lg: 'span 12' } }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="h6" fontWeight={700}>Последние дела</Typography>
                <IconButton
                  onClick={() => navigate('/cases')}
                  sx={{ color: palette.softChalk, border: `1px solid ${alpha('#FFFFFF', 0.2)}` }}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
              <List sx={{ py: 0 }}>
                {recentCases.map((caseItem) => (
                  <ListItem
                    key={caseItem.id}
                    sx={{
                      px: 1,
                      borderRadius: 3,
                      '&:hover': { bgcolor: alpha('#FFFFFF', 0.05) },
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(palette.cyberBlue, 0.28),
                          border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
                          color: palette.softChalk,
                        }}
                      >
                        <Gavel />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={caseItem.case_number}
                      secondary={caseItem.object_address}
                      primaryTypographyProps={{ fontWeight: 600, color: palette.softChalk }}
                      secondaryTypographyProps={{ color: alpha(palette.softChalk, 0.65) }}
                    />
                    <Chip
                      size="small"
                      label={dayjs(caseItem.deadline).format('DD.MM')}
                      sx={{
                        color: palette.softChalk,
                        bgcolor: dayjs(caseItem.deadline).isBefore(dayjs(), 'day')
                          ? alpha('#FF8D8D', 0.2)
                          : alpha('#89CBFF', 0.2),
                        border: `1px solid ${alpha('#7EA2D8', 0.3)}`,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
