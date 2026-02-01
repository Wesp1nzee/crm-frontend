import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useState } from 'react';
import type { ClientType } from '../../entities/client/types';

interface ClientFormData {
  name: string;
  short_name: string;
  type: ClientType;
  inn: string;
  email: string;
  phone: string;
  legal_address: string;
  actual_address: string;
}

interface ClientCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading: boolean;
}

const TYPE_ICONS = {
  legal: '🏢',
  individual: '👤',
  court: '⚖️',
};

export function ClientCreateDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: ClientCreateDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    short_name: '',
    type: 'legal',
    inn: '',
    email: '',
    phone: '',
    legal_address: '',
    actual_address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTypeChange = (type: ClientType) => {
    setFormData(prev => ({
      ...prev,
      type,
      inn: type !== 'legal' ? '' : prev.inn,
    }));
    if (type !== 'legal') {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs.inn;
        return newErrs;
      });
    }
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
    
    // Если меняем тип клиента и это не юрлицо, удаляем ошибку ИНН
    if (field === 'type' && value !== 'legal') {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs.inn;
        return newErrs;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Обязательное поле';
    }
    // Проверяем ИНН только для юридических лиц
    if (formData.type === 'legal' && (!formData.inn || !/^\d{10,12}$/.test(formData.inn))) {
      newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      const submitData = {
        ...formData,
        inn: formData.type === 'legal' && formData.inn ? formData.inn : undefined,
      };
      
      await onSubmit(submitData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: theme.shadows[8],
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight={600} 
          color="text.primary"
          component="span"
        >
          Создать нового клиента
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Основная информация
          </Typography>
          <TextField
            fullWidth
            label="Полное название *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            autoFocus
            size="small"
            inputProps={{ style: { fontSize: '14px' } }}
          />
          <TextField
            fullWidth
            label="Краткое название"
            value={formData.short_name}
            onChange={(e) => handleChange('short_name', e.target.value)}
            size="small"
            sx={{ mt: 2 }}
            inputProps={{ style: { fontSize: '14px' } }}
          />
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel id="client-type-label">Тип клиента *</InputLabel>
            <Select
              labelId="client-type-label"
              value={formData.type}
              label="Тип клиента *"
              onChange={(e) => handleTypeChange(e.target.value as ClientType)}
              renderValue={(value) => (
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {TYPE_ICONS[value]} {value === 'legal' ? 'Юридическое лицо' : value === 'individual' ? 'Физическое лицо' : 'Суд'}
                </Box>
              )}
            >
              <MenuItem value="legal">
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {TYPE_ICONS.legal} Юридическое лицо
                </Box>
              </MenuItem>
              <MenuItem value="individual">
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {TYPE_ICONS.individual} Физическое лицо
                </Box>
              </MenuItem>
              <MenuItem value="court">
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {TYPE_ICONS.court} Суд
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Контакты */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Контакты
          </Typography>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            size="small"
            placeholder="example@domain.ru"
            sx={{ mt: 2 }}
            inputProps={{ style: { fontSize: '14px' } }}
          />
          <TextField
            fullWidth
            label="Телефон"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            size="small"
            placeholder="+7 (999) 000-00-00"
            sx={{ mt: 2 }}
            inputProps={{ style: { fontSize: '14px' } }}
          />
        </Box>

        {/* ИНН — только для ЮЛ */}
        {formData.type === 'legal' && (
          <Box mb={3}>
            <TextField
              fullWidth
              label="ИНН *"
              value={formData.inn}
              onChange={(e) => handleChange('inn', e.target.value.replace(/\D/g, ''))}
              error={!!errors.inn}
              helperText={
                errors.inn ? (
                  <Typography variant="caption" color="error">
                    {errors.inn}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    10 или 12 цифр
                  </Typography>
                )
              }
              size="small"
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 12, inputMode: 'numeric', style: { fontSize: '14px' } }}
            />
          </Box>
        )}

        {/* Адреса */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Адреса
          </Typography>
          <TextField
            fullWidth
            label="Юридический адрес"
            multiline
            rows={2}
            value={formData.legal_address}
            onChange={(e) => handleChange('legal_address', e.target.value)}
            size="small"
            placeholder="Улица, дом, город, ИНН (если есть)"
            sx={{ mt: 2 }}
            inputProps={{ style: { fontSize: '14px' } }}
          />
          <TextField
            fullWidth
            label="Фактический адрес"
            multiline
            rows={2}
            value={formData.actual_address}
            onChange={(e) => handleChange('actual_address', e.target.value)}
            size="small"
            placeholder="Если отличается от юридического"
            sx={{ mt: 2 }}
            inputProps={{ style: { fontSize: '14px' } }}
          />
        </Box>

        {Object.keys(errors).length > 0 && (
          <Alert severity="warning" sx={{ mt: 3, borderRadius: '8px' }}>
            Пожалуйста, исправьте ошибки в форме.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
          disabled={isLoading || !formData.name.trim()}
          sx={{
            minWidth: 120,
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 12px rgba(66, 153, 225, 0.2)' },
          }}
        >
          {isLoading ? 'Создание...' : 'Создать клиента'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}