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
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Work,
} from '@mui/icons-material';
import { useExperts, useCreateExpert, useUpdateExpert, useDeleteExpert, useCases } from '../../shared/hooks/useCases';
import type { Expert } from '../../entities/expert/types';
import { useNavigate } from 'react-router-dom';

const specializations = [
  'Строительно-техническая экспертиза',
  'Оценочная экспертиза',
  'Пожарно-техническая экспертиза',
  'Автотехническая экспертиза',
  'Землеустроительная экспертиза',
  'Экологическая экспертиза',
];

export function ExpertsPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: [] as string[],
    status: 'active' as Expert['status'],
  });

  const { data: experts, isLoading, error } = useExperts();
  const { data: cases } = useCases();
  const createExpert = useCreateExpert();
  const updateExpert = useUpdateExpert();
  const deleteExpert = useDeleteExpert();

  const getExpertWorkload = (expertId: string) => {
    return cases?.filter(c => c.assignedExpertId === expertId && !['done', 'closed'].includes(c.status)).length || 0;
  };

  const handleOpenDialog = (expert?: Expert) => {
    if (expert) {
      setEditingExpert(expert);
      setFormData({
        name: expert.name,
        email: expert.email,
        phone: expert.phone,
        specialization: expert.specialization,
        status: expert.status,
      });
    } else {
      setEditingExpert(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: [],
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpert(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingExpert) {
        await updateExpert.mutateAsync({ id: editingExpert.id, data: formData });
      } else {
        await createExpert.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expert:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эксперта?')) {
      await deleteExpert.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки экспертов
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Эксперты
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Добавить эксперта
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Специализация</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Нагрузка</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {experts?.map((expert) => (
              <TableRow key={expert.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    <Typography fontWeight="medium">{expert.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{expert.email}</TableCell>
                <TableCell>{expert.phone}</TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {expert.specialization.map((spec, index) => (
                      <Chip key={index} label={spec} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={expert.status === 'active' ? 'Активен' : 'Неактивен'}
                    color={expert.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Work />
                    <Typography>{getExpertWorkload(expert.id)} дел</Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases?expert=${expert.id}`);
                      }}
                    >
                      Посмотреть
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton size="small" onClick={() => handleOpenDialog(expert)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(expert.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpert ? 'Редактировать эксперта' : 'Добавить эксперта'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Имя"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Телефон"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Autocomplete
              multiple
              options={specializations}
              value={formData.specialization}
              onChange={(_, newValue) => setFormData({ ...formData, specialization: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Специализация" />
              )}
            />
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
            disabled={createExpert.isPending || updateExpert.isPending}
          >
            {editingExpert ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}