// src/pages/cases/CaseListPage.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
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
  CircularProgress,
  Alert,
  TablePagination,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Fade,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases, useCreateCase, useDeleteCase } from '../../shared/hooks/useCases';
import type { CaseStatus, GetCasesQuery } from '../../entities/case/types';
import { CreateCaseDialog } from './CreateCaseDialog';
import { CaseFilters } from './CaseFilters';
import { notificationService } from '../../shared/services/notifications';


const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  archive: 'Архив',
  in_work: 'В работе',
  debt: 'Долг',
  executed: 'Выполнено',
  withdrawn: 'Отозвано',
  cancelled: 'Отменено',
  fssp: 'ФССП',
};


// ── Component ────────────────────────────────────────────────────────────────

export function CaseListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<GetCasesQuery>({
    page: 1,
    limit: 20,
    sort_field: 'created_at',
    sort_order: 'desc',
  });

  // Читаем параметры из URL при загрузке
  useEffect(() => {
    const clientId = searchParams.get('client');
    if (clientId) {
      console.log('Setting client filter:', clientId);
      setFilters(prev => ({ ...prev, client_id: clientId }));
    }
  }, [searchParams]);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCaseId, setDeletingCaseId] = useState<string>('');

  const { data: casesResponse, isLoading, error, refetch } = useCases(filters);
  
  const createCase = useCreateCase();
  const deleteCase = useDeleteCase();


  const cases = casesResponse?.data || [];
  const totalCases = casesResponse?.pagination?.total || 0;
  const currentPage = (casesResponse?.pagination?.page || 1) - 1;
  const pageSize = casesResponse?.pagination?.limit || 20;

  const handleCreateSubmit = async (formData: Parameters<typeof createCase.mutateAsync>[0]) => {
    try {
      await createCase.mutateAsync(formData);
      notificationService.success(`Дело "${formData.case_number}" успешно создано`);
      setCreateDialogOpen(false);
      refetch();
    } catch (err: any) {
      notificationService.error(err.response?.data?.detail || 'Ошибка создания дела');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingCaseId) return;
    try {
      await deleteCase.mutateAsync(deletingCaseId);
      notificationService.success('Дело успешно удалено');
      setDeleteDialogOpen(false);
      setDeletingCaseId('');
      refetch();
    } catch (err: any) {
      notificationService.error(err.response?.data?.detail || 'Ошибка удаления дела');
    }
  };

  // ── Navigation / Dialog openers ──────────────────────────────────────────

  const handleOpenDetail = (caseId: string) => navigate(`/crm/cases/${caseId}`);

  const handleOpenDelete = (caseId: string) => {
    setDeletingCaseId(caseId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingCaseId('');
  };

  // ── Pagination handlers ──────────────────────────────────────────────────
  const handleChangePage = (_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // ── Loading / Error states ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
        Ошибка загрузки списка дел: {(error as Error).message}
      </Alert>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Дела
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {totalCases} дел
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
          sx={{ borderRadius: 3, px: 2.25 }}
        >
          Создать дело
        </Button>
      </Box>

      {/* Filters */}
      <CaseFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.paper' }}>
                <TableCell width="5%">№</TableCell>
                <TableCell width="15%">Номер дела</TableCell>
                <TableCell width="15%">Суд / Орган</TableCell>
                <TableCell width="20%">Адрес объекта</TableCell>
                <TableCell width="10%">Статус</TableCell>
                <TableCell width="10%">Срок</TableCell>
                <TableCell width="10%">Стоимость</TableCell>
                <TableCell width="12%">Эксперт</TableCell>
                <TableCell width="13%" align="center">
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((case_, index) => (
                <TableRow
                  key={case_.id}
                  hover
                  onClick={() => handleOpenDetail(case_.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    transition: 'background-color 0.15s ease',
                    backgroundColor: index % 2 ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {case_.number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      <Typography variant="body2" fontWeight="medium">
                        {case_.case_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {case_.case_type}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{case_.authority}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={case_.object_address}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {case_.object_address}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CASE_STATUS_LABELS[case_.status]}
                      size="small"
                      variant="filled"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        bgcolor:
                          case_.status === 'executed' ? 'rgba(34,197,94,0.14)' :
                          case_.status === 'debt' ? 'rgba(245,158,11,0.14)' :
                          case_.status === 'cancelled' ? 'rgba(239,68,68,0.14)' :
                          case_.status === 'in_work' ? 'rgba(79,144,255,0.14)' :
                          'rgba(120,120,120,0.12)',
                        color:
                          case_.status === 'executed' ? 'success.dark' :
                          case_.status === 'debt' ? 'warning.dark' :
                          case_.status === 'cancelled' ? 'error.dark' :
                          case_.status === 'in_work' ? 'primary.dark' : 'text.secondary',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: dayjs(case_.deadline).isBefore(dayjs(), 'day')
                          ? 'error.main'
                          : 'text.primary',
                        fontWeight: dayjs(case_.deadline).isBefore(dayjs(), 'day')
                          ? 'medium'
                          : 'regular',
                      }}
                    >
                      {dayjs(case_.deadline).format('DD.MM.YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {new Intl.NumberFormat('ru-RU').format(Number(case_.cost))} ₽
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {case_.assigned_expert ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {case_.assigned_expert.full_name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          {case_.assigned_expert.full_name}
                        </Typography>
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="disabled" />
                        <Typography variant="body2" color="text.secondary">
                          Не назначен
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Просмотр" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(case_.id);
                          }}
                          sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(case_.id);
                          }}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              color: 'text.primary',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {cases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Stack spacing={2} alignItems="center">
                      <Box sx={{
                        width: 88,
                        height: 88,
                        borderRadius: 6,
                        background: 'linear-gradient(160deg, rgba(79,144,255,0.3), rgba(255,255,255,0.75))',
                        border: '1px solid rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 14px 30px rgba(79,144,255,0.18)',
                      }}>
                        <InfoIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        Нет данных
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Создайте первое дело для начала работы
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={totalCases}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{ '.MuiTablePagination-actions .Mui-disabled': { opacity: 0.3 } }}
        />
      </Card>

      {/* ── Create dialog ── */}
      <CreateCaseDialog
        open={createDialogOpen}
        isPending={createCase.isPending}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={200}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <WarningIcon />
          Подтверждение удаления
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', border: 'none' }}
            >
              Вы уверены, что хотите удалить это дело? Это действие нельзя отменить.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              После удаления все связанные данные будут безвозвратно потеряны. Убедитесь, что вы
              сохранили все необходимые документы.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            size="large"
            disabled={deleteCase.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteIcon />}
            disabled={deleteCase.isPending}
          >
            {deleteCase.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}