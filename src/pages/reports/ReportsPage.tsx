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
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

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
  logoutTime?:  string;
  ipAddress:  string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  status: 'success' | 'failed' | 'warning';
  location?: string;
  duration?: number;
  sessionId:  string;
}

interface ReportMetric {
  date: string;
  cases: number;
  documents: number;
  revenue: number;
  users: number;
}

interface SystemMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  activeUsers: number;
}

const mockStorageData: StorageMetric[] = [
  {
    category: 'Документы',
    used: 45.2,
    limit: 100,
    percent: 45.2,
    icon: <AssignmentOutlined />,
  },
  {
    category: 'Фотографии',
    used:  28.5,
    limit: 100,
    percent: 28.5,
    icon: <CloudUploadOutlined />,
  },
  {
    category:  'Видео',
    used: 15.3,
    limit: 100,
    percent: 15.3,
    icon: <TrendingUpOutlined />,
  },
  {
    category:  'Резервные копии',
    used: 8.7,
    limit: 50,
    percent: 17.4,
    icon: <StorageOutlined />,
  },
];

const mockLoginLogs: LoginLog[] = [
  {
    id: '1',
    userName: 'Иван Петров',
    userEmail: 'ivan.petrov@crm.local',
    loginTime: dayjs().subtract(2, 'hours').toISOString(),
    logoutTime: dayjs().subtract(1, 'hours').toISOString(),
    ipAddress: '192.168.1.100',
    deviceType: 'desktop',
    browser: 'Chrome 120.0',
    status: 'success',
    location: 'Москва, Россия',
    duration: 3600,
    sessionId: 'sess_12345',
  },
  {
    id:  '2',
    userName: 'Мария Сидорова',
    userEmail: 'maria.sidorova@crm.local',
    loginTime: dayjs().subtract(5, 'hours').toISOString(),
    ipAddress: '192.168.1.101',
    deviceType: 'mobile',
    browser: 'Safari Mobile 17.2',
    status: 'success',
    location: 'Санкт-Петербург, Россия',
    sessionId: 'sess_12346',
  },
  {
    id: '3',
    userName: 'Алексей Козлов',
    userEmail:  'alex.kozlov@crm.local',
    loginTime: dayjs().subtract(8, 'hours').toISOString(),
    logoutTime: dayjs().subtract(7, 'hours').toISOString(),
    ipAddress: '192.168.1.102',
    deviceType: 'tablet',
    browser: 'Chrome 120.0',
    status: 'success',
    location: 'Екатеринбург, Россия',
    duration: 3600,
    sessionId: 'sess_12347',
  },
  {
    id: '4',
    userName: 'Неизвестный пользователь',
    userEmail: 'unknown@external.com',
    loginTime: dayjs().subtract(10, 'hours').toISOString(),
    ipAddress: '203.0.113.45',
    deviceType: 'desktop',
    browser: 'Firefox 121.0',
    status: 'failed',
    location: 'Неизвестно',
    sessionId: 'sess_12348',
  },
  {
    id: '5',
    userName: 'Сергей Волков',
    userEmail: 'sergey.volkov@crm.local',
    loginTime: dayjs().subtract(1, 'day').toISOString(),
    logoutTime: dayjs().subtract(1, 'day').add(2, 'hours').toISOString(),
    ipAddress: '192.168.1.103',
    deviceType: 'desktop',
    browser: 'Edge 120.0',
    status: 'success',
    location: 'Казань, Россия',
    duration: 7200,
    sessionId: 'sess_12349',
  },
];

const mockReportData: ReportMetric[] = [
  {
    date:  '2025-01-01',
    cases: 12,
    documents: 45,
    revenue: 125000,
    users: 8,
  },
  {
    date: '2025-01-02',
    cases: 15,
    documents: 52,
    revenue: 145000,
    users: 10,
  },
  {
    date: '2025-01-03',
    cases: 18,
    documents: 61,
    revenue: 165000,
    users: 12,
  },
  {
    date: '2025-01-04',
    cases: 14,
    documents: 48,
    revenue: 135000,
    users: 9,
  },
  {
    date: '2025-01-05',
    cases: 20,
    documents: 68,
    revenue: 185000,
    users: 14,
  },
];


interface TabPanelProps {
  children?:  React.ReactNode;
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
        subheader={`Используется ${totalUsed. toFixed(1)} ГБ из ${totalLimit} ГБ`}
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
                      <Box sx={{ color:  COLORS[index] }}>{metric.icon}</Box>
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
                    value={metric. percent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        background:  COLORS[index],
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
        return <ErrorOutlineOutlined sx={{ color:  'error.main' }} />;
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
        label={statusMap[status]. label}
        color={statusMap[status].color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getDeviceChip = (device: LoginLog['deviceType']) => {
    const deviceMap = {
      desktop:  { label: 'ПК', color: 'primary' },
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
            {filteredLogs.length === 0 ?  (
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
                    <Box>{getDeviceChip(log. deviceType)}</Box>
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
                            {log.userName. charAt(0)}
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
                      <TableCell>{getDeviceChip(log. deviceType)}</TableCell>
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
                    borderRadius:  4,
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

export function ReportsPage() {
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
            Отчеты и аналитика
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Полный анализ деятельности и безопасности системы
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
          <Tab label="Хранилище" />
          <Tab label="Логи входа" />
          <Tab label="Статистика" />
        </Tabs>
      </Paper>

      {/* Content */}
      <TabPanel value={tabValue} index={0}>
        <StorageAnalyticsCard />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LoginLogsSection />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
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
                onChange={(e) => setExportFormat(e. target.value as any)}
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