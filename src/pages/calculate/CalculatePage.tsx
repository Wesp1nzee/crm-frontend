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
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Calculate,
  TableChart,
  Delete,
  Edit,
  Visibility,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { CalculationCard } from './CalculationCard';
import { EmptyState } from './EmptyState';
import type { CalculationTable, CalculationType } from './types';

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

export function CalculatePage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [tableName, setTableName] = useState('');
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
    setSelectedType(typeId);
    setCreateDialogOpen(true);
  };

  const handleShowTables = (typeId: string) => {
    setSelectedType(typeId);
    setListDialogOpen(true);
  };

  const handleSaveTable = () => {
    if (!tableName.trim()) return;

    const newTable: CalculationTable = {
      id: Date.now().toString(),
      name: tableName,
      type: selectedType,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'draft',
    };

    setTables([...tables, newTable]);
    setCreateDialogOpen(false);
    setTableName('');
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
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
          <Box sx={{ pt: 1 }}>
            {selectedType && (
              <Box display="flex" alignItems="center" mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSaveTable}
            variant="contained"
            disabled={!tableName.trim()}
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
                  <ListItemSecondaryAction>
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
                  </ListItemSecondaryAction>
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