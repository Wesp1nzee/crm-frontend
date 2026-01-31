// src/pages/cases/CaseListPage.tsx
import { useState, useEffect } from 'react';
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
  TablePagination,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Business,
  Gavel,
  Search,
  Close,
  Save,
  FilterList,
  CalendarToday,
  AttachFile,
  Description
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases, useCreateCase, useUpdateCase, useDeleteCase } from '../../shared/hooks/useCases';
import type { 
  Case, 
  CaseCreateRequest, 
  CaseUpdateRequest,
  CaseStatus,
  CaseType
} from '../../entities/case/types';
import type { ClientShort } from '../../entities/client/types';
import type { Expert } from '../../entities/expert/types';

// ===== КОНСТАНТЫ ДЛЯ ОТОБРАЖЕНИЯ =====
const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'Новое',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Завершено',
  closed: 'Закрыто',
  overdue: 'Просрочено',
};

const CASE_STATUS_COLORS: Record<CaseStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success'> = {
  new: 'default',
  in_progress: 'primary',
  review: 'secondary',
  done: 'success',
  closed: 'default',
  overdue: 'error',
};

const CASE_TYPE_LABELS: Record<CaseType, string> = {
  civil: 'Гражданское',
  criminal: 'Уголовное',
  administrative: 'Административное',
  arbitration: 'Арбитражное',
};

const CASE_TYPE_COLORS: Record<CaseType, 'primary' | 'secondary' | 'error' | 'warning' | 'info'> = {
  civil: 'primary',
  criminal: 'error',
  administrative: 'warning',
  arbitration: 'info',
};

export function CaseListPage() {
  const navigate = useNavigate();
  
  // ===== СОСТОЯНИЕ =====
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CaseType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [deletingCaseId, setDeletingCaseId] = useState<string>('');
  
  // ===== ФОРМА =====
  const initialFormData: CaseCreateRequest = {
    caseNumber: '',
    objectAddress: '',
    description: '',
    status: 'new',
    type: 'civil',
    deadline: dayjs().add(30, 'day').toISOString(),
    clientId: '',
    expertId: '',
  };
  
  const [formData, setFormData] = useState<CaseCreateRequest>(initialFormData);
  const [clients, setClients] = useState<ClientShort[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  
  // ===== ХУКИ =====
  const { 
    data: casesResponse, 
    isLoading, 
    error,
    refetch 
  } = useCases({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: searchQuery || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });
  
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const deleteCase = useDeleteCase();
  
  // Загружаем клиентов и экспертов
  useEffect(() => {
    // Здесь нужно добавить хуки для загрузки клиентов и экспертов
    // или передать их через props если они уже загружены в родительском компоненте
  }, []);
  
  // ===== УВЕДОМЛЕНИЯ =====
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  const cases = casesResponse?.items || [];
  const totalCases = casesResponse?.total || 0;
  
  const formatDateTime = (date: string) => {
    return dayjs(date).format('DD.MM.YYYY HH:mm');
  };
  
  const formatDate = (date: string) => {
    return dayjs(date).format('DD.MM.YYYY');
  };
  
  const getStatusColor = (status: CaseStatus) => {
    return CASE_STATUS_COLORS[status];
  };
  
  const getTypeColor = (type: CaseType) => {
    return CASE_TYPE_COLORS[type];
  };
  
  // ===== ОБРАБОТЧИКИ =====
  const handleCreate = async () => {
    try {
      await createCase.mutateAsync(formData);
      
      setSnackbar({
        open: true,
        message: `Дело "${formData.caseNumber}" успешно создано`,
        severity: 'success',
      });
      
      setCreateDialogOpen(false);
      setFormData(initialFormData);
      refetch();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Ошибка создания дела',
        severity: 'error',
      });
    }
  };
  
  const handleUpdate = async () => {
    if (!editingCaseId) return;
    
    try {
      const updateData: CaseUpdateRequest = {
        caseNumber: formData.caseNumber,
        objectAddress: formData.objectAddress,
        description: formData.description,
        status: formData.status,
        type: formData.type,
        deadline: formData.deadline,
        clientId: formData.clientId,
        expertId: formData.expertId,
      };
      
      await updateCase.mutateAsync({ id: editingCaseId, data: updateData });
      
      setSnackbar({
        open: true,
        message: `Дело "${formData.caseNumber}" успешно обновлено`,
        severity: 'success',
      });
      
      setEditDialogOpen(false);
      setFormData(initialFormData);
      setEditingCaseId(null);
      refetch();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Ошибка обновления дела',
        severity: 'error',
      });
    }
  };
  
  const handleDelete = async () => {
    if (!deletingCaseId) return;
    
    try {
      await deleteCase.mutateAsync(deletingCaseId);
      
      setSnackbar({
        open: true,
        message: 'Дело успешно удалено',
        severity: 'success',
      });
      
      setDeleteDialogOpen(false);
      setDeletingCaseId('');
      refetch();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Ошибка удаления дела',
        severity: 'error',
      });
    }
  };
  
  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setCreateDialogOpen(true);
  };
  
  const handleOpenEdit = (case_: Case) => {
    setEditingCaseId(case_.id);
    setFormData({
      caseNumber: case_.caseNumber,
      objectAddress: case_.objectAddress,
      description: case_.description,
      status: case_.status,
      type: case_.type,
      deadline: case_.deadline,
      clientId: case_.clientId,
      expertId: case_.expertId || '',
    });
    setEditDialogOpen(true);
  };
  
  const handleOpenDetail = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };
  
  const handleOpenDelete = (caseId: string) => {
    setDeletingCaseId(caseId);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setFormData(initialFormData);
    setEditingCaseId(null);
    setDeletingCaseId('');
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // ===== РЕНДЕРИНГ =====
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки списка дел: {(error as Error).message}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Заголовок и поиск */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Дела
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {totalCases} дел
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          sx={{ 
            boxShadow: 3,
            '&:hover': { boxShadow: 6 }
          }}
        >
          Создать дело
        </Button>
      </Box>
      
      {/* Фильтры и поиск */}
      <Paper sx={{ p: 2, mb: 3, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по номеру или адресу объекта..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                label="Статус"
                onChange={(e) => {
                  setStatusFilter(e.target.value as CaseStatus | 'all');
                  setPage(0);
                }}
              >
                <MenuItem value="all">Все статусы</MenuItem>
                {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Тип дела</InputLabel>
              <Select
                value={typeFilter}
                label="Тип дела"
                onChange={(e) => {
                  setTypeFilter(e.target.value as CaseType | 'all');
                  setPage(0);
                }}
              >
                <MenuItem value="all">Все типы</MenuItem>
                {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                size="small"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPage(0);
                }}
                variant={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'contained' : 'outlined'}
              >
                Сбросить
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Таблица дел */}
      <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Номер дела</TableCell>
              <TableCell>Адрес объекта</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Эксперт</TableCell>
              <TableCell>Срок</TableCell>
              <TableCell>Создано</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((case_) => {
              return (
                <TableRow 
                  key={case_.id} 
                  hover
                  onClick={() => handleOpenDetail(case_.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {case_.caseNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={case_.objectAddress}>
                      <span>
                        {case_.objectAddress.length > 50 
                          ? `${case_.objectAddress.substring(0, 50)}...` 
                          : case_.objectAddress}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CASE_TYPE_LABELS[case_.type]}
                      size="small"
                      color={getTypeColor(case_.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CASE_STATUS_LABELS[case_.status]}
                      size="small"
                      color={getStatusColor(case_.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {case_.clientName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {case_.expertName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday fontSize="small" color={dayjs(case_.deadline).isBefore(dayjs(), 'day') ? 'error' : 'inherit'} />
                      <Typography 
                        variant="body2"
                        color={dayjs(case_.deadline).isBefore(dayjs(), 'day') ? 'error' : 'inherit'}
                      >
                        {formatDate(case_.deadline)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDateTime(case_.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(case_);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(case_.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Пагинация */}
      <TablePagination
        component="div"
        count={totalCases}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
        rowsPerPageOptions={[10, 20, 50, 100]}
        sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      />
      
      {/* Диалог создания/редактирования дела */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={handleCloseDialogs}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCaseId ? 'Редактировать дело' : 'Создать новое дело'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Номер дела*"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  required
                  autoFocus
                  error={!formData.caseNumber.trim()}
                  helperText={!formData.caseNumber.trim() ? 'Обязательное поле' : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Тип дела"
                  select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CaseType })}
                >
                  {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Адрес объекта*"
                  value={formData.objectAddress}
                  onChange={(e) => setFormData({ ...formData, objectAddress: e.target.value })}
                  required
                  error={!formData.objectAddress.trim()}
                  helperText={!formData.objectAddress.trim() ? 'Обязательное поле' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Статус"
                  select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CaseStatus })}
                >
                  {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Срок выполнения"
                  type="date"
                  value={dayjs(formData.deadline).format('YYYY-MM-DD')}
                  onChange={(e) => setFormData({ ...formData, deadline: dayjs(e.target.value).toISOString() })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  value={clients.find(c => c.id === formData.clientId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, clientId: newValue?.id || '' })}
                  renderInput={(params) => <TextField {...params} label="Клиент*" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={experts}
                  getOptionLabel={(option) => option.fullName || option.name || ''}
                  value={experts.find(e => e.id === formData.expertId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, expertId: newValue?.id || '' })}
                  renderInput={(params) => <TextField {...params} label="Эксперт" />}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button 
            onClick={handleCloseDialogs} 
            startIcon={<Close />}
            disabled={createCase.isPending || updateCase.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={editingCaseId ? handleUpdate : handleCreate}
            variant="contained"
            startIcon={<Save />}
            disabled={
              createCase.isPending || 
              updateCase.isPending || 
              !formData.caseNumber.trim() ||
              !formData.objectAddress.trim() ||
              !formData.clientId
            }
            sx={{ 
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}
          >
            {createCase.isPending || updateCase.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить это дело? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialogs}
            disabled={deleteCase.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deleteCase.isPending}
            sx={{ 
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}
          >
            {deleteCase.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}