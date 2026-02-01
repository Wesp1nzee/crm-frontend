import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  Divider,
} from '@mui/material';
import {
  DownloadOutlined,
  RefreshOutlined,
  StorageOutlined,
  AssignmentOutlined,
  TrendingUpOutlined,
  SecurityOutlined,
  VisibilityOutlined,
  MoreVertOutlined,
  FilterListOutlined,
  CloudUploadOutlined,
  CheckCircleOutlineOutlined,
  WarningOutlined,
  ErrorOutlineOutlined,
  AccountBalance,
  Receipt,
  Warning as WarningIcon,
  TrendingUp,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

// Типы данных
interface StorageMetric {
  category: string;
  used: number;
  limit: number;
  percent: number;
  icon: React.ReactNode;
}

interface LoginLog {
  id: string;
  userName: string;
  userEmail: string;
  loginTime: string;
  logoutTime?: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  status: 'success' | 'failed' | 'warning';
  location?: string;
  duration?: number;
  sessionId: string;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  caseId: string;
  createdAt: string;
  dueDate: string;
  paidAt?: string;
}

interface Case {
  id: string;
  caseNumber: string;
  clientId: string;
  clientName?: string;
  client?: {
    name: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportMetric {
  date: string;
  cases: number;
  documents: number;
  revenue: number;
  users: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Моковые данные
const mockStorageData: StorageMetric[] = [
  { category: 'Документы', used: 45.2, limit: 100, percent: 45.2, icon: <AssignmentOutlined /> },
  { category: 'Финансы', used: 23.1, limit: 50, percent: 46.2, icon: <AccountBalance /> },
  { category: 'Изображения', used: 12.8, limit: 25, percent: 51.2, icon: <CloudUploadOutlined /> },
  { category: 'Видео', used: 8.9, limit: 20, percent: 44.5, icon: <AssignmentOutlined /> },
];

const mockLoginLogs: LoginLog[] = [
  {
    id: '1',
    userName: 'Иван Петров',
    userEmail: 'ivan@example.com',
    loginTime: '2026-02-01T09:30:00Z',
    ipAddress: '192.168.1.100',
    deviceType: 'desktop',
    browser: 'Chrome',
    status: 'success',
    location: 'Москва, РФ',
    duration: 120,
    sessionId: 'session-001'
  },
  {
    id: '2',
    userName: 'Мария Сидорова',
    userEmail: 'maria@example.com',
    loginTime: '2026-02-01T10:15:00Z',
    ipAddress: '192.168.1.101',
    deviceType: 'mobile',
    browser: 'Safari',
    status: 'success',
    location: 'Санкт-Петербург, РФ',
    duration: 45,
    sessionId: 'session-002'
  },
  {
    id: '3',
    userName: 'Алексей Козлов',
    userEmail: 'alexey@example.com',
    loginTime: '2026-02-01T11:20:00Z',
    ipAddress: '192.168.1.102',
    deviceType: 'tablet',
    browser: 'Firefox',
    status: 'failed',
    location: 'Новосибирск, РФ',
    sessionId: 'session-003'
  },
];

const mockReportData: ReportMetric[] = [
  { date: '2026-01-27', cases: 12, documents: 45, revenue: 250000, users: 8 },
  { date: '2026-01-28', cases: 15, documents: 52, revenue: 320000, users: 10 },
  { date: '2026-01-29', cases: 8, documents: 38, revenue: 180000, users: 7 },
  { date: '2026-01-30', cases: 18, documents: 67, revenue: 410000, users: 12 },
  { date: '2026-01-31', cases: 14, documents: 55, revenue: 290000, users: 9 },
];

const mockInvoices: Invoice[] = [
  { id: 'inv-001', number: 'INV-2026-001', amount: 150000, status: 'paid', caseId: 'case-001', createdAt: '2026-01-15T10:00:00Z', dueDate: '2026-01-25T23:59:59Z', paidAt: '2026-01-20T14:30:00Z' },
  { id: 'inv-002', number: 'INV-2026-002', amount: 220000, status: 'sent', caseId: 'case-002', createdAt: '2026-01-20T09:00:00Z', dueDate: '2026-01-30T23:59:59Z' },
  { id: 'inv-003', number: 'INV-2026-003', amount: 95000, status: 'overdue', caseId: 'case-003', createdAt: '2026-01-10T11:00:00Z', dueDate: '2026-01-20T23:59:59Z' },
  { id: 'inv-004', number: 'INV-2026-004', amount: 180000, status: 'draft', caseId: 'case-004', createdAt: '2026-01-25T13:00:00Z', dueDate: '2026-02-05T23:59:59Z' },
  { id: 'inv-005', number: 'INV-2026-005', amount: 310000, status: 'paid', caseId: 'case-005', createdAt: '2026-01-05T16:00:00Z', dueDate: '2026-01-15T23:59:59Z', paidAt: '2026-01-12T09:45:00Z' },
];

const mockCases: Case[] = [
  { id: 'case-001', caseNumber: 'CASE-2026-001', clientId: 'client-001', clientName: 'ООО "Ромашка"', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-20T14:30:00Z' },
  { id: 'case-002', caseNumber: 'CASE-2026-002', clientId: 'client-002', clientName: 'АО "Солнечные технологии"', status: 'in-progress', createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-25T10:00:00Z' },
  { id: 'case-003', caseNumber: 'CASE-2026-003', clientId: 'client-003', clientName: 'ИП "Веселый"', status: 'closed', createdAt: '2025-12-15T00:00:00Z', updatedAt: '2026-01-10T16:00:00Z' },
  { id: 'case-004', caseNumber: 'CASE-2026-004', clientId: 'client-001', clientName: 'ООО "Ромашка"', status: 'new', createdAt: '2026-01-25T00:00:00Z', updatedAt: '2026-01-25T13:00:00Z' },
  { id: 'case-005', caseNumber: 'CASE-2026-005', clientId: 'client-004', clientName: 'ЗАО "Городские решения"', status: 'active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-30T11:00:00Z' },
];

function FinanceDashboard() {
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all');
  
  const invoices = mockInvoices;
  const payments = [];
  const cases = mockCases;

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
  const thisMonthRevenue = payments?.filter((p: any) => 
    dayjs(p.receivedAt).isAfter(dayjs().startOf('month'))
  ).reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Финансовая аналитика
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
                <WarningIcon color="error" sx={{ fontSize: 40 }} />
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

function StorageAnalyticsCard() {
  const theme = useTheme();
  const totalUsed = mockStorageData.reduce((sum, item) => sum + item.used, 0);
  const totalLimit = mockStorageData.reduce((sum, item) => sum + item.limit, 0);
  const totalPercent = (totalUsed / totalLimit) * 100;

  const chartData = mockStorageData.map(item => ({
    name: item.category,
    value: item.used,
    percent: item.percent,
  }));

  const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2'];

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={<StorageOutlined sx={{ color: 'primary.main', fontSize: 28 }} />}
        title="Анализ облачного хранилища"
        subheader={`Используется ${totalUsed.toFixed(1)} ГБ из ${totalLimit} ГБ`}
        action={
          <Tooltip title="Обновить">
            <IconButton size="small">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Overall Progress */}
          <Grid item xs={12}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Общее использование
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {totalPercent.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalPercent}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Распределение по категориям
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          {/* Detailed Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Детальная статистика
            </Typography>
            <Box>
              {mockStorageData.map((metric, index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ color: COLORS[index] }}>{metric.icon}</Box>
                      <Typography variant="body2" fontWeight="500">
                        {metric.category}
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight="bold">
                      {metric.used.toFixed(1)} / {metric.limit} ГБ
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metric.percent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        background: COLORS[index],
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function LoginLogsSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'failed' | 'warning'>('all');
  const [selectedDevice, setSelectedDevice] = useState<'all' | 'desktop' | 'mobile' | 'tablet'>('all');

  const filteredLogs = useMemo(() => {
    return mockLoginLogs.filter(log => {
      if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
      if (selectedDevice !== 'all' && log.deviceType !== selectedDevice) return false;
      return true;
    });
  }, [selectedStatus, selectedDevice]);

  const getStatusIcon = (status: LoginLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlineOutlined sx={{ color: 'success.main' }} />;
      case 'failed':
        return <ErrorOutlineOutlined sx={{ color: 'error.main' }} />;
      case 'warning': 
        return <WarningOutlined sx={{ color: 'warning.main' }} />;
    }
  };

  const getStatusChip = (status: LoginLog['status']) => {
    const statusMap = {
      success: { label: 'Успешно', color: 'success' as const },
      failed: { label: 'Ошибка', color: 'error' as const },
      warning: { label: 'Предупреждение', color: 'warning' as const },
    };
    return (
      <Chip
        icon={getStatusIcon(status)}
        label={statusMap[status].label}
        color={statusMap[status].color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getDeviceChip = (device: LoginLog['deviceType']) => {
    const deviceMap = {
      desktop: { label: 'ПК', color: 'primary' },
      mobile: { label: 'Мобиль', color: 'info' },
      tablet: { label: 'Планшет', color: 'secondary' },
    };
    return <Chip label={deviceMap[device].label} size="small" variant="outlined" />;
  };

  return (
    <Card>
      <CardHeader
        avatar={<SecurityOutlined sx={{ color: 'primary.main', fontSize: 28 }} />}
        title="Логи входа пользователей"
        subheader={`Всего записей: ${mockLoginLogs.length}`}
        action={
          <Box display="flex" gap={1}>
            <Tooltip title="Фильтры">
              <IconButton
                size="small"
                onClick={() => setFilterOpen(!filterOpen)}
                color={filterOpen ? 'primary' : 'default'}
              >
                <FilterListOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Скачать отчет">
              <IconButton size="small">
                <DownloadOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {filterOpen && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Статус</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Статус"
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="success">Успешно</MenuItem>
                  <MenuItem value="failed">Ошибка</MenuItem>
                  <MenuItem value="warning">Предупреждение</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Устройство</InputLabel>
                <Select
                  value={selectedDevice}
                  label="Устройство"
                  onChange={(e) => setSelectedDevice(e.target.value as any)}
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="desktop">ПК</MenuItem>
                  <MenuItem value="mobile">Мобиль</MenuItem>
                  <MenuItem value="tablet">Планшет</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}

      <CardContent>
        {isMobile ? (
          // Mobile view - Cards instead of table
          <Box display="flex" flexDirection="column" gap={2}>
            {filteredLogs.length === 0 ? (
              <Alert severity="info">Логи не найдены</Alert>
            ) : (
              filteredLogs.map(log => (
                <Paper
                  key={log.id}
                  sx={{
                    p: 2,
                    borderLeft: 4,
                    borderColor: 
                      log.status === 'success'
                        ? 'success.main'
                        : log.status === 'failed'
                          ? 'error.main'
                          : 'warning.main',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {log.userName.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {log.userName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userEmail}
                      </Typography>
                    </Box>
                    {getStatusChip(log.status)}
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      Время входа:
                    </Typography>
                    <Typography variant="caption" fontWeight="500">
                      {dayjs(log.loginTime).format('HH:mm, DD MMM')}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      IP адрес:
                    </Typography>
                    <Typography variant="caption" fontWeight="500">
                      {log.ipAddress}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      Устройство:
                    </Typography>
                    <Box>{getDeviceChip(log.deviceType)}</Box>
                  </Box>
                  {log.location && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="textSecondary">
                        Локация:
                      </Typography>
                      <Typography variant="caption" fontWeight="500">
                        {log.location}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>
        ) : (
          // Desktop view - Table
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>IP адрес</TableCell>
                  <TableCell>Время входа</TableCell>
                  <TableCell>Устройство</TableCell>
                  <TableCell>Браузер</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Локация</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">Логи не найдены</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {log.userName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {log.userName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.userEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(log.loginTime).format('DD MMM, HH:mm')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dayjs(log.loginTime).fromNow()}
                        </Typography>
                      </TableCell>
                      <TableCell>{getDeviceChip(log.deviceType)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{log.browser}</Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(log.status)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {log.location || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Подробнее">
                          <IconButton size="small">
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Меню">
                          <IconButton size="small">
                            <MoreVertOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsChartSection() {
  return (
    <Card>
      <CardHeader
        avatar={<TrendingUpOutlined sx={{ color: 'primary.main', fontSize: 28 }} />}
        title="Статистика деятельности"
        subheader="Данные за последние 5 дней"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Дела и Документы
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={date => dayjs(date).format('DD MMM')}
                />
                <YAxis />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                />
                <Legend />
                <Bar dataKey="cases" fill="#1976d2" name="Дела" />
                <Bar dataKey="documents" fill="#388e3c" name="Документы" />
              </BarChart>
            </ResponsiveContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Финансовые показатели
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={date => dayjs(date).format('DD MMM')}
                />
                <YAxis />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f57c00"
                  strokeWidth={2}
                  name="Доход (₽)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    console.log(`Экспорт отчета в формате ${exportFormat}`);
    setExportDialogOpen(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Аналитика и отчеты
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Комплексная аналитика деятельности и финансового состояния
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadOutlined />}
          onClick={() => setExportDialogOpen(true)}
        >
          Экспорт отчета
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Финансы" />
          <Tab label="Хранилище" />
          <Tab label="Логи входа" />
          <Tab label="Статистика" />
        </Tabs>
      </Paper>

      {/* Content */}
      <TabPanel value={tabValue} index={0}>
        <FinanceDashboard />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <StorageAnalyticsCard />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <LoginLogsSection />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ReportsChartSection />
      </TabPanel>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Экспорт отчета</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Формат файла</InputLabel>
              <Select
                value={exportFormat}
                label="Формат файла"
                onChange={(e) => setExportFormat(e.target.value as any)}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel (XLSX)</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleExport}>
            Скачать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}