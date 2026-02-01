// src/pages/cases/CreateCaseDialog.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Grid,
  IconButton,
  Chip,
  Fade,
  InputAdornment,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  BusinessCenter as BusinessCenterIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { CaseStatus, CaseCreateRequest } from '../../entities/case/types';
import { useClientsSuggest } from '../../shared/hooks/useClientsSuggest';
import { useExpertsSuggest } from '../../shared/hooks/useExpertsSuggest';
import { useCreateClient } from '../../shared/hooks/useClients';
import type { ClientCreateRequest as ClientCreateRequestType } from '../../entities/client/types';
import { ClientCreateDialog } from '../clients/ClientCreateDialog';

const INPUT_HEIGHT = 54;
const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  archive: 'Архив',
  in_work: 'В работе',
  debt: 'Долг',
  executed: 'Выполнено',
  withdrawn: 'Отозвано',
  cancelled: 'Отменено',
  fssp: 'ФССП',
};
const CASE_STATUS_COLORS: Record<
  CaseStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'
> = {
  archive: 'default',
  in_work: 'primary',
  debt: 'warning',
  executed: 'success',
  withdrawn: 'secondary',
  cancelled: 'error',
  fssp: 'info',
};

export function createInitialFormData(): CaseCreateRequest {
  return {
    client_id: '',
    number: '',
    case_number: '',
    authority: '',
    case_type: '',
    object_type: '',
    object_address: '',
    status: 'in_work' as CaseStatus,
    start_date: dayjs().toISOString(),
    deadline: dayjs().add(30, 'day').toISOString(),
    cost: 0,
    bank_transfer_amount: 0,
    cash_amount: 0,
    remaining_debt: 0,
    plaintiff: '',
    defendant: '',
    remarks: '',
    assigned_user_id: '',
  };
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: 'primary.main',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" lineHeight={1.3}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'grey.50',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        '&:first-of-type': { mt: 0 },
      }}
    >
      {children}
    </Box>
  );
}

// Reusable sx для однострочных input-ов
const singleLineInputSx = {
  '& .MuiInputBase-root': {
    height: INPUT_HEIGHT,
    minHeight: INPUT_HEIGHT,
    boxSizing: 'border-box',
    px: 1.5,
    width: '100%',
  },
  '& .MuiOutlinedInput-input': {
    py: 0,
    minHeight: INPUT_HEIGHT - 2,
    boxSizing: 'border-box',
    width: '100%',
  },
} as const;

/**
 * Нормализует данные формы перед отправкой на бэкенд
 * Соответствует схеме CaseBase на бэкенде
 */
function normalizeCasePayload(formData: CaseCreateRequest) {
  return {
    // Обязательные поля
    client_id: formData.client_id.trim(),
    number: formData.number.trim(),
    case_number: formData.case_number.trim(),
    authority: formData.authority.trim(),
    case_type: formData.case_type.trim(),
    object_type: formData.object_type.trim(),
    object_address: formData.object_address.trim(),
    status: formData.status,
    start_date: formData.start_date, // ISO string
    deadline: formData.deadline, // ISO string
    
    // Финансы - конвертируем в строки с 2 знаками после запятой для точности Decimal
    cost: formData.cost.toFixed(2),
    bank_transfer_amount: formData.bank_transfer_amount.toFixed(2),
    cash_amount: formData.cash_amount.toFixed(2),
    remaining_debt: formData.remaining_debt.toFixed(2),
    
    // Опциональные поля - пустые строки → null
    plaintiff: formData.plaintiff?.trim() || null,
    defendant: formData.defendant?.trim() || null,
    remarks: formData.remarks?.trim() || null,
    
    // assigned_user_id: пустая строка → null
    assigned_user_id: formData.assigned_user_id?.trim() || null,
    
    // Поля, которые НЕ отправляются при создании (только при обновлении)
    // completion_date: null, // будет установлено бэкендом при завершении
    // expert_painting: null, // не используется в форме создания
    // archive_status: null, // будет установлено бэкендом при архивации
  };
}

interface CreateCaseDialogProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: CaseCreateRequest) => Promise<void>;
}

export function CreateCaseDialog({
  open,
  isPending,
  onClose,
  onSubmit,
}: CreateCaseDialogProps) {
  const [formData, setFormData] = useState<CaseCreateRequest>(createInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { suggestions, isLoading: isSuggestLoading, fetchSuggestions, clearSuggestions } =
    useClientsSuggest();
  const {
    suggestions: expertSuggestions,
    isLoading: isExpertSuggestLoading,
    fetchSuggestions: fetchExpertSuggestions,
    clearSuggestions: clearExpertSuggestions,
  } = useExpertsSuggest();
  
  const createClient = useCreateClient();
  
  const [clientInputValue, setClientInputValue] = useState('');
  const [expertInputValue, setExpertInputValue] = useState('');
  
  // Выбранный клиент — отдельный state, не зависит от suggestions
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<{ id: string; name: string } | null>(null);
  
  // Состояние для модального окна создания клиента
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  
  // Флаг для отслеживания создания клиента через модальное окно
  const [clientCreatedFromDialog, setClientCreatedFromDialog] = useState(false);

  // Сброс формы при закрытии диалога
  const handleClose = useCallback(() => {
    setFormData(createInitialFormData());
    setErrors({});
    setClientInputValue('');
    setExpertInputValue('');
    setSelectedClient(null);
    setSelectedExpert(null);
    setClientCreatedFromDialog(false);
    clearSuggestions();
    clearExpertSuggestions();
    onClose();
  }, [onClose, clearSuggestions, clearExpertSuggestions]);

  // Сброс формы при открытии (на случай повторного открытия)
  const handleEntered = useCallback(() => {
    setFormData(createInitialFormData());
    setErrors({});
    setClientInputValue('');
    setExpertInputValue('');
    setSelectedClient(null);
    setSelectedExpert(null);
    setClientCreatedFromDialog(false);
    clearSuggestions();
    clearExpertSuggestions();
  }, [clearSuggestions, clearExpertSuggestions]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const isFormValid =
    formData.client_id.trim() &&
    formData.number.trim() &&
    formData.case_number.trim() &&
    formData.authority.trim() &&
    formData.case_type.trim() &&
    formData.object_type.trim() &&
    formData.object_address.trim();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.client_id.trim()) newErrors.client_id = 'Выберите клиента';
    if (!formData.number.trim()) newErrors.number = 'Обязательное поле';
    if (!formData.case_number.trim()) newErrors.case_number = 'Обязательное поле';
    if (!formData.authority.trim()) newErrors.authority = 'Обязательное поле';
    if (!formData.case_type.trim()) newErrors.case_type = 'Обязательное поле';
    if (!formData.object_type.trim()) newErrors.object_type = 'Обязательное поле';
    if (!formData.object_address.trim()) newErrors.object_address = 'Обязательное поле';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Нормализуем данные перед отправкой
    const normalizedData = normalizeCasePayload(formData);
    
    // Отправляем нормализованные данные
    await onSubmit(normalizedData as CaseCreateRequest);
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: '' };
    });
  };

  // Обработчик создания клиента из модального окна
  const handleCreateClient = async (clientData: ClientCreateRequestType) => {
    try {
      const newClient = await createClient.mutateAsync(clientData);
      
      // Автоматически выбираем созданного клиента в поле
      setFormData((prev) => ({ ...prev, client_id: newClient.id }));
      setSelectedClient({ id: newClient.id, name: newClient.name });
      setClientInputValue(newClient.name);
      setClientCreatedFromDialog(true);
      
      // Очищаем ошибку, если она была
      clearError('client_id');
      
      // Закрываем модальное окно создания клиента
      setCreateClientDialogOpen(false);
    } catch (error) {
      console.error('Ошибка создания клиента:', error);
      // Ошибка будет обработана в самом модальном окне
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={240}
      TransitionProps={{ onEntered: handleEntered }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a2332 0%, #0f172a 100%)',
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: 'rgba(255,255,255,0.12)',
            }}
          >
            <BusinessCenterIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#fff', lineHeight: 1.3 }}>
              Новое дело
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Заполните обязательные поля и сохраните
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── Body ── */}
      <DialogContent
        sx={{
          p: 3,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          bgcolor: '#fafbfc',
        }}
      >
        {/* Клиент и реквизиты */}
        <FormSection>
          <SectionHeader
            icon={<BusinessCenterIcon sx={{ fontSize: 18 }} />}
            title="Клиент и реквизиты дела"
            subtitle="Обязательная информация"
          />
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ position: 'relative' }}>
                <Autocomplete
                  fullWidth
                  options={suggestions}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedClient}
                  inputValue={clientInputValue}
                  loading={isSuggestLoading}
                  filterOptions={(options) => options}
                  noOptionsText={
                    clientInputValue.trim().length === 0
                      ? 'Начните ввод для поиска...'
                      : isSuggestLoading
                      ? 'Поиск...'
                      : clientCreatedFromDialog && selectedClient
                      ? `Выбран: ${selectedClient.name}`
                      : 'Клиенты не найдены'
                  }
                  onInputChange={(_e, newInputValue, reason) => {
                    setClientInputValue(newInputValue);
                    if (reason === 'clear') {
                      clearSuggestions();
                    } else if (reason === 'input') {
                      fetchSuggestions(newInputValue);
                    }
                  }}
                  onChange={(_e, value, reason) => {
                    if (reason === 'clear') {
                      setFormData((prev) => ({ ...prev, client_id: '' }));
                      setSelectedClient(null);
                      setClientInputValue('');
                      clearSuggestions();
                      setClientCreatedFromDialog(false);
                    } else if (value) {
                      setFormData((prev) => ({ ...prev, client_id: value.id }));
                      setSelectedClient(value);
                      setClientInputValue(value.name);
                      clearError('client_id');
                      setClientCreatedFromDialog(false);
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  // ИСПРАВЛЕНИЕ 1: Отключаем кнопку очистки
                  disableClearable
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.id}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Клиент"
                      required
                      placeholder="Введите название клиента..."
                      error={!!errors.client_id}
                      helperText={errors.client_id}
                      sx={singleLineInputSx}
                      InputProps={{
                        ...params.InputProps,
                        // Убираем стандартную кнопку очистки
                        endAdornment: (
                          <>
                            {isSuggestLoading ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1 }}>
                            <PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                <Tooltip title="Добавить нового клиента" arrow>
                  <IconButton
                    onClick={() => setCreateClientDialogOpen(true)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      bgcolor: 'primary.main',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                fullWidth
                options={expertSuggestions}
                getOptionLabel={(option) => option.name || ''}
                value={selectedExpert}
                inputValue={expertInputValue}
                loading={isExpertSuggestLoading}
                filterOptions={(options) => options}
                noOptionsText={
                  expertInputValue.trim().length === 0
                    ? 'Начните ввод для поиска...'
                    : isExpertSuggestLoading
                    ? 'Поиск...'
                    : 'Эксперты не найдены'
                }
                onInputChange={(_e, newInputValue, reason) => {
                  setExpertInputValue(newInputValue);
                  if (reason === 'clear') {
                    clearExpertSuggestions();
                  } else if (reason === 'input') {
                    fetchExpertSuggestions(newInputValue);
                  }
                }}
                onChange={(_e, value, reason) => {
                  if (reason === 'clear') {
                    setFormData((prev) => ({ ...prev, assigned_user_id: '' }));
                    setSelectedExpert(null);
                    setExpertInputValue('');
                    clearExpertSuggestions();
                  } else if (value) {
                    setFormData((prev) => ({ ...prev, assigned_user_id: value.id }));
                    setSelectedExpert(value);
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disableClearable
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Эксперт
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Назначить эксперта"
                    placeholder="Введите имя эксперта..."
                    sx={singleLineInputSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isExpertSuggestLoading ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 1 }}>
                          <PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField
                fullWidth
                label="№ п/п"
                required
                value={formData.number}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, number: e.target.value }));
                  if (e.target.value.trim()) clearError('number');
                }}
                error={!!errors.number}
                helperText={errors.number}
                autoFocus
                sx={singleLineInputSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Номер дела"
                required
                value={formData.case_number}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, case_number: e.target.value }));
                  if (e.target.value.trim()) clearError('case_number');
                }}
                error={!!errors.case_number}
                helperText={errors.case_number}
                sx={singleLineInputSx}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Объект и орган */}
        <FormSection>
          <SectionHeader
            icon={<LocationOnIcon sx={{ fontSize: 18 }} />}
            title="Объект и орган"
            subtitle="Сведения о предмете и рассматривающем органе"
          />
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Суд / Орган"
                required
                value={formData.authority}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, authority: e.target.value }));
                  if (e.target.value.trim()) clearError('authority');
                }}
                error={!!errors.authority}
                helperText={errors.authority}
                sx={singleLineInputSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Вид экспертизы"
                required
                value={formData.case_type}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, case_type: e.target.value }));
                  if (e.target.value.trim()) clearError('case_type');
                }}
                error={!!errors.case_type}
                helperText={errors.case_type}
                sx={singleLineInputSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Тип объекта"
                required
                value={formData.object_type}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, object_type: e.target.value }));
                  if (e.target.value.trim()) clearError('object_type');
                }}
                error={!!errors.object_type}
                helperText={errors.object_type}
                sx={singleLineInputSx}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Адрес объекта"
                required
                multiline
                minRows={2}
                value={formData.object_address}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, object_address: e.target.value }));
                  if (e.target.value.trim()) clearError('object_address');
                }}
                error={!!errors.object_address}
                helperText={errors.object_address}
                sx={{
                  '& .MuiInputBase-root': {
                    minHeight: INPUT_HEIGHT * 2,
                    boxSizing: 'border-box',
                    px: 1.5,
                    width: '100%',
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 0.75,
                    boxSizing: 'border-box',
                    width: '100%',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                      <LocationOnIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Статус и сроки */}
        <FormSection>
          <SectionHeader
            icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
            title="Статус и сроки"
          />
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  fullWidth
                  value={formData.status}
                  label="Статус"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as CaseStatus }))
                  }
                  sx={{
                    height: INPUT_HEIGHT,
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 0,
                      width: '100%',
                    },
                    '& .MuiOutlinedInput-input': { py: 0, width: '100%' },
                  }}
                >
                  {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      <Chip
                        label={label}
                        size="small"
                        color={CASE_STATUS_COLORS[value as CaseStatus]}
                        variant="filled"
                        sx={{ fontWeight: 'medium', fontSize: '0.7rem', height: 22, cursor: 'pointer' }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Дата начала"
                type="date"
                value={dayjs(formData.start_date).format('YYYY-MM-DD')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: dayjs(e.target.value).toISOString(),
                  }))
                }
                InputLabelProps={{ shrink: true }}
                sx={singleLineInputSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Срок выполнения"
                type="date"
                value={dayjs(formData.deadline).format('YYYY-MM-DD')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deadline: dayjs(e.target.value).toISOString(),
                  }))
                }
                InputLabelProps={{ shrink: true }}
                sx={singleLineInputSx}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Финансы */}
        <FormSection>
          <SectionHeader
            icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />}
            title="Финансы"
            subtitle="Все суммы в рублях"
          />
          <Grid container spacing={2.5} alignItems="stretch">
            {(
              [
                { field: 'cost', label: 'Стоимость' },
                { field: 'bank_transfer_amount', label: 'Безналичные' },
                { field: 'cash_amount', label: 'Наличные' },
                { field: 'remaining_debt', label: 'Остаток долга' },
              ] as const
            ).map(({ field, label }) => (
              <Grid key={field} size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label={label}
                  type="number"
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field]: Number(e.target.value) }))
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                  }}
                  sx={singleLineInputSx}
                />
              </Grid>
            ))}
          </Grid>
        </FormSection>

        {/* Стороны дела */}
        <FormSection>
          <SectionHeader
            icon={<PersonIcon sx={{ fontSize: 18 }} />}
            title="Стороны дела"
          />
          <Grid container spacing={2.5} alignItems="stretch">
            {(
              [
                { field: 'plaintiff', label: 'Истец' },
                { field: 'defendant', label: 'Ответчик' },
              ] as const
            ).map(({ field, label }) => (
              <Grid key={field} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={label}
                  value={formData[field] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={singleLineInputSx}
                />
              </Grid>
            ))}
          </Grid>
        </FormSection>

        {/* Примечания */}
        <FormSection>
          <SectionHeader
            icon={<DescriptionIcon sx={{ fontSize: 18 }} />}
            title="Примечания"
          />
          <TextField
            fullWidth
            label="Примечания"
            multiline
            rows={4}
            value={formData.remarks || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, remarks: e.target.value }))
            }
            placeholder="Дополнительная информация о деле..."
            sx={{
              '& .MuiInputBase-root': {
                minHeight: INPUT_HEIGHT * 4,
                boxSizing: 'border-box',
                px: 1.5,
                width: '100%',
              },
              '& .MuiOutlinedInput-input': {
                py: 0.75,
                boxSizing: 'border-box',
                width: '100%',
              },
              '& textarea.MuiInputBase-inputMultiline': {
                width: '100%',
                boxSizing: 'border-box',
              },
            }}
          />
        </FormSection>
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#fafbfc',
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          size="medium"
          color="inherit"
          sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'grey.100' } }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="medium"
          disabled={!isFormValid || isPending}
          sx={{
            minWidth: 140,
            borderRadius: '8px',
            fontWeight: 600,
            boxShadow: 'none',
            '&:not(:disabled):hover': {
              boxShadow: '0 4px 12px rgba(25,39,58,0.35)',
            },
          }}
        >
          {isPending ? <CircularProgress size={18} color="inherit" /> : 'Создать дело'}
        </Button>
      </DialogActions>

      {/* ── Модальное окно создания клиента ── */}
      <ClientCreateDialog
        open={createClientDialogOpen}
        onClose={() => setCreateClientDialogOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />
    </Dialog>
  );
}