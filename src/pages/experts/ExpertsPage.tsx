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
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Work,
  Search,
  FilterList,
  Refresh,
  Visibility,
  VisibilityOff,
  Autorenew,
} from '@mui/icons-material';
import {
  useExperts,
  useCreateExpert,
  useUpdateExpert,
  useDeleteExpert,
  type Expert,
} from '../../shared/hooks/useExperts';
import { UserRole } from '../../shared/types/user';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

export function ExpertsPage() {
  const navigate = useNavigate();
  
  // Состояние фильтров
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    role: 'all' as 'all' | UserRole.EXPERT | UserRole.ACCOUNTANT,
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    role: UserRole.EXPERT,
    status: 'active' as Expert['status'],
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Дебаунс для поиска
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Вычисляем параметры для запроса
  const queryFilters = {
    role: filters.role === 'all' ? undefined : (filters.role as UserRole),
    search: debouncedSearch || undefined,
    is_active: filters.status === 'all' 
      ? undefined 
      : (filters.status === 'active'),
  };

  // FIX: useQuery возвращает `data`, а не `experts` — переименовываем через `data: experts`
  const { data: experts, isLoading, error, refetch, isRefetching } = useExperts(queryFilters);
  const createExpert = useCreateExpert();
  const updateExpert = useUpdateExpert();
  const deleteExpert = useDeleteExpert();

  // Обработчики фильтров
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (event: React.MouseEvent<HTMLElement>, newStatus: string | null) => {
    if (newStatus) {
      setFilters({ ...filters, status: newStatus as typeof filters.status });
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFilters({ ...filters, role: e.target.value as 'all' | UserRole.EXPERT | UserRole.ACCOUNTANT });
  };

  const handleClearFilters = () => {
    setFilters({ search: '', status: 'all', role: 'all' });
  };

  const handleOpenDialog = (expert?: Expert) => {
    if (expert) {
      setEditingExpert(expert);
      setFormData({
        name: expert.name,
        email: expert.email,
        phone: expert.phone || '',
        specialization: expert.specialization?.[0] || '',
        role: expert.role,
        status: expert.status,
        password: '',
      });
    } else {
      setEditingExpert(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        role: UserRole.EXPERT,
        status: 'active',
        password: '',
      });
    }
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpert(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      role: UserRole.EXPERT,
      status: 'active',
      password: '',
    });
    setShowPassword(false);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        specialization: formData.specialization || undefined,
        role: formData.role,
        status: formData.status,
        password: formData.password || undefined,
      };

      if (editingExpert) {
        const { password: _, ...updateData } = submitData;
        await updateExpert.mutateAsync({ id: editingExpert.id, data: updateData });
      } else {
        await createExpert.mutateAsync(submitData);
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Ошибка сохранения пользователя: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить пользователя?')) {
      try {
        await deleteExpert.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка удаления пользователя: ' + (error as Error).message);
      }
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка загрузки пользователей: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Заголовок и кнопки */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Пользователи
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? 'Обновление...' : 'Обновить'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Добавить пользователя
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по имени или email..."
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Роль</InputLabel>
              <Select
                value={filters.role}
                label="Роль"
                onChange={handleRoleChange}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value={UserRole.EXPERT}>Эксперт</MenuItem>
                <MenuItem value={UserRole.ACCOUNTANT}>Бухгалтер</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <ToggleButtonGroup
              value={filters.status}
              exclusive
              onChange={handleStatusChange}
              fullWidth
              size="small"
            >
              <ToggleButton value="all" sx={{ flex: 1 }}>
                Все
              </ToggleButton>
              <ToggleButton value="active" sx={{ flex: 1 }} color="success">
                Активные
              </ToggleButton>
              <ToggleButton value="inactive" sx={{ flex: 1 }}>
                Неактивные
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          {(filters.search || filters.status !== 'all' || filters.role !== 'all') && (
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                size="small"
                onClick={handleClearFilters}
                startIcon={<FilterList />}
              >
                Сбросить
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Таблица */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Специализация</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {experts?.map((expert) => (
              <TableRow key={expert.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography fontWeight="medium">{expert.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{expert.email}</TableCell>
                <TableCell>
                  <Chip
                    label={expert.role === UserRole.EXPERT ? 'Эксперт' : 'Бухгалтер'}
                    color={expert.role === UserRole.EXPERT ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {expert.specialization?.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {expert.specialization.map((spec, index) => (
                        <Chip key={index} label={spec} size="small" variant="outlined" />
                      ))}
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={expert.status === 'active' ? 'Активен' : 'Неактивен'}
                    color={expert.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton size="small" onClick={() => handleOpenDialog(expert)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(expert.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {experts && experts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {filters.search || filters.status !== 'all' || filters.role !== 'all'
                      ? 'Не найдено пользователей по заданным фильтрам' 
                      : 'Нет пользователей'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Модальное окно */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpert ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Имя"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!formData.name.trim()}
              helperText={!formData.name.trim() ? 'Имя обязательно' : ''}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!formData.email.trim()}
              helperText={!formData.email.trim() ? 'Email обязателен' : ''}
            />
            <FormControl fullWidth>
              <InputLabel>Роль</InputLabel>
              <Select
                value={formData.role}
                label="Роль"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <MenuItem value={UserRole.EXPERT}>Эксперт</MenuItem>
                <MenuItem value={UserRole.ACCOUNTANT}>Бухгалтер</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Специализация"
              fullWidth
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
            {!editingExpert && (
              <TextField
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={formData.password.length > 0 && formData.password.length < 12}
                helperText={
                  formData.password.length > 0 && formData.password.length < 12
                    ? 'Пароль должен быть не менее 12 символов'
                    : 'Минимум 12 символов'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton
                        onClick={generatePassword}
                        edge="end"
                        title="Сгенерировать пароль"
                      >
                        <Autorenew />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={formData.status}
                label="Статус"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Expert['status'] })}
              >
                <MenuItem value="active">Активен</MenuItem>
                <MenuItem value="inactive">Неактивен</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              createExpert.isPending || 
              updateExpert.isPending ||
              !formData.name.trim() ||
              !formData.email.trim() ||
              (!editingExpert && formData.password.length > 0 && formData.password.length < 12)
            }
          >
            {(createExpert.isPending || updateExpert.isPending) ? 'Сохранение...' : (editingExpert ? 'Сохранить' : 'Создать')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}