import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Calculate,
  TableChart,
  Delete,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { CalculationCard } from './CalculationCard';
import { EmptyState } from './EmptyState';
import type { CalculationTable } from './types';

const calculationTypes = [
  {
    id: 'leifer',
    title: 'Оценка по Лейферу',
    description: 'Расчет стоимости недвижимости по справочникам Лейфера',
    icon: <Calculate />,
    color: '#1976d2',
  },
  {
    id: 'construction',
    title: 'Строительная экспертиза',
    description: 'Расчет стоимости строительных работ и материалов',
    icon: <TableChart />,
    color: '#2e7d32',
  },
];

// Список доступных справочников
const dictionaries = [
  { id: 'leifer_2024_apartments', title: 'Лейфер 2024 Квартиры' },
];

export function CalculatePage() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [tableName, setTableName] = useState('');
  const [selectedDictionary, setSelectedDictionary] = useState<string>('');
  
  const [tables, setTables] = useState<CalculationTable[]>([
    {
      id: '1',
      name: 'Оценка квартиры на Тверской',
      type: 'leifer',
      createdAt: '2024-01-15T10:00:00Z',
      lastModified: '2024-01-20T14:30:00Z',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Экспертиза офисного здания',
      type: 'construction',
      createdAt: '2024-01-18T09:15:00Z',
      lastModified: '2024-01-18T16:45:00Z',
      status: 'draft',
    },
  ]);

  const handleCreateTable = (typeId: string) => {
    if (typeId === 'leifer') {
      navigate('/calculate/leifer');
      return;
    }
    setSelectedType(typeId);
    setTableName('');
    setSelectedDictionary(''); // Сбрасываем при открытии
    setCreateDialogOpen(true);
  };

  const handleShowTables = (typeId: string) => {
    setSelectedType(typeId);
    setListDialogOpen(true);
  };

  const handleSaveTable = () => {
    if (!tableName.trim()) return;
    if (selectedType === 'leifer' && !selectedDictionary) return;

    const newTable: CalculationTable = {
      id: Date.now().toString(),
      name: tableName,
      type: selectedType,
      // Сохраняем информацию о справочнике в объект, если нужно (расширьте тип CalculationTable при необходимости)
      dictionary: selectedType === 'leifer' ? selectedDictionary : undefined,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'draft',
    } as any; // Приведение к any, если в CalculationTable еще нет поля dictionary

    setTables([...tables, newTable]);
    setCreateDialogOpen(false);
    setTableName('');
    setSelectedDictionary('');
    setSelectedType('');
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Удалить таблицу расчетов?')) {
      setTables(tables.filter(table => table.id !== id));
    }
  };

  const getTypeInfo = (typeId: string) => {
    return calculationTypes.find(type => type.id === typeId);
  };

  const getFilteredTables = (typeId: string) => {
    return tables.filter(table => table.type === typeId);
  };

  // Проверка валидности формы создания
  const isFormInvalid = !tableName.trim() || (selectedType === 'leifer' && !selectedDictionary);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Расчеты и оценка
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Выберите тип расчета для создания новой таблицы или просмотра существующих
      </Typography>

      <Grid container spacing={3}>
        {calculationTypes.map((type) => (
          <Grid item xs={12} md={6} key={type.id}>
            <CalculationCard
              type={type}
              tablesCount={getFilteredTables(type.id).length}
              completedCount={getFilteredTables(type.id).filter(t => t.status === 'completed').length}
              onCreateTable={handleCreateTable}
              onShowTables={handleShowTables}
            />
          </Grid>
        ))}
      </Grid>

      {/* Create Table Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Создать новую таблицу расчетов
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedType && (
              <Box display="flex" alignItems="center" p={2} bgcolor="grey.50" borderRadius={1}>
                <Box sx={{ color: getTypeInfo(selectedType)?.color, mr: 2 }}>
                  {getTypeInfo(selectedType)?.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getTypeInfo(selectedType)?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeInfo(selectedType)?.description}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <TextField
              label="Название таблицы"
              fullWidth
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Например: Оценка квартиры на ул. Ленина"
              autoFocus
            />

            {/* ВЫБОР СПРАВОЧНИКА: Показывается только для Лейфера */}
            {selectedType === 'leifer' && (
              <FormControl fullWidth>
                <InputLabel id="dictionary-select-label">Выберите справочник</InputLabel>
                <Select
                  labelId="dictionary-select-label"
                  value={selectedDictionary}
                  label="Выберите справочник"
                  onChange={(e) => setSelectedDictionary(e.target.value)}
                >
                  {dictionaries.map((dict) => (
                    <MenuItem key={dict.id} value={dict.id}>
                      {dict.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveTable}
            variant="contained"
            disabled={isFormInvalid}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tables List Dialog */}
      <Dialog open={listDialogOpen} onClose={() => setListDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Таблицы расчетов: {getTypeInfo(selectedType)?.title}
        </DialogTitle>
        <DialogContent>
          <List>
            {getFilteredTables(selectedType).length === 0 ? (
              <EmptyState
                title="Нет таблиц расчетов"
                description={`Создайте первую таблицу для типа "${getTypeInfo(selectedType)?.title}"`}
                actionText="Создать таблицу"
                onAction={() => {
                  setListDialogOpen(false);
                  setCreateDialogOpen(true);
                }}
              />
            ) : (
              getFilteredTables(selectedType).map((table) => (
                <ListItem key={table.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {table.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={table.status === 'completed' ? 'Завершено' : 'Черновик'}
                          color={table.status === 'completed' ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Создано: {dayjs(table.createdAt).format('DD.MM.YYYY HH:mm')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Изменено: {dayjs(table.lastModified).format('DD.MM.YYYY HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemText>
                    <Box display="flex" gap={1}>
                      <IconButton size="small" title="Просмотр">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" title="Редактировать">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        title="Удалить"
                        onClick={() => handleDeleteTable(table.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemText>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}