import { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Autocomplete,
  InputAdornment,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useExperts } from '../../shared/hooks/useExperts';
import { useClients } from '../../shared/hooks/useClients';
import type { GetCasesQuery, CaseStatus } from '../../entities/case/types';

const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: 'archive', label: 'Архив' },
  { value: 'in_work', label: 'В работе' },
  { value: 'debt', label: 'Долг' },
  { value: 'executed', label: 'Выполнено' },
  { value: 'withdrawn', label: 'Отозвано' },
  { value: 'cancelled', label: 'Отменено' },
  { value: 'fssp', label: 'ФССП' },
];

const SORT_FIELDS = [
  { value: 'created_at', label: 'Дата создания' },
  { value: 'updated_at', label: 'Дата обновления' },
  { value: 'start_date', label: 'Дата начала' },
  { value: 'deadline', label: 'Срок выполнения' },
  { value: 'completion_date', label: 'Дата завершения' },
  { value: 'number', label: 'Номер дела' },
  { value: 'case_number', label: 'Номер производства' },
  { value: 'status', label: 'Статус' },
  { value: 'cost', label: 'Стоимость' },
  { value: 'remaining_debt', label: 'Остаток долга' },
  { value: 'client_name', label: 'Имя клиента' },
  { value: 'expert_name', label: 'Имя эксперта' },
];

interface CaseFiltersProps {
  filters: GetCasesQuery;
  onFiltersChange: (filters: GetCasesQuery) => void;
}

export function CaseFilters({ filters, onFiltersChange }: CaseFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: experts = [] } = useExperts();
  const { data: clients } = useClients();

  const updateFilter = (key: keyof GetCasesQuery, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'page' && key !== 'limit' && filters[key as keyof GetCasesQuery]
  );

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Basic Filters */}
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск по всем полям..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
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
          <Autocomplete
            multiple
            size="small"
            options={CASE_STATUSES}
            getOptionLabel={(option) => option.label}
            value={CASE_STATUSES.filter(s => filters.status?.includes(s.value)) || []}
            onChange={(_, value) => updateFilter('status', value.map(v => v.value))}
            renderInput={(params) => (
              <TextField {...params} label="Статус" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.label}
                  size="small"
                  {...getTagProps({ index })}
                />
              ))
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Эксперт</InputLabel>
            <Select
              value={filters.expert_id || ''}
              label="Эксперт"
              onChange={(e) => updateFilter('expert_id', e.target.value || undefined)}
            >
              <MenuItem value="">Все эксперты</MenuItem>
              {experts.map((expert) => (
                <MenuItem key={expert.id} value={expert.id}>
                  {expert.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Box display="flex" gap={1}>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              color={expanded ? 'primary' : 'default'}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={clearFilters}
              >
                Очистить
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Расширенные фильтры
          </Typography>
          
          <Grid container spacing={2}>
            {/* Client Filter */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Клиент</InputLabel>
                <Select
                  value={filters.client_id || ''}
                  label="Клиент"
                  onChange={(e) => updateFilter('client_id', e.target.value || undefined)}
                >
                  <MenuItem value="">Все клиенты</MenuItem>
                  {clients?.items?.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Case Type */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Тип дела"
                value={filters.case_type || ''}
                onChange={(e) => updateFilter('case_type', e.target.value)}
              />
            </Grid>

            {/* Object Type */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Тип объекта"
                value={filters.object_type || ''}
                onChange={(e) => updateFilter('object_type', e.target.value)}
              />
            </Grid>

            {/* Authority */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Орган власти"
                value={filters.authority || ''}
                onChange={(e) => updateFilter('authority', e.target.value)}
              />
            </Grid>

            {/* Object Address */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Адрес объекта"
                value={filters.object_address || ''}
                onChange={(e) => updateFilter('object_address', e.target.value)}
              />
            </Grid>

            {/* Case Numbers */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Номер дела"
                value={filters.number || ''}
                onChange={(e) => updateFilter('number', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Номер производства"
                value={filters.case_number || ''}
                onChange={(e) => updateFilter('case_number', e.target.value)}
              />
            </Grid>

            {/* Cost Range */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Мин. стоимость"
                value={filters.min_cost || ''}
                onChange={(e) => updateFilter('min_cost', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Макс. стоимость"
                value={filters.max_cost || ''}
                onChange={(e) => updateFilter('max_cost', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>

            {/* Date Ranges */}
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Дата начала от"
                value={filters.start_date ? dayjs(filters.start_date) : null}
                onChange={(date) => updateFilter('start_date', date?.toISOString())}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Дата начала до"
                value={filters.end_date ? dayjs(filters.end_date) : null}
                onChange={(date) => updateFilter('end_date', date?.toISOString())}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Срок от"
                value={filters.deadline_start_date ? dayjs(filters.deadline_start_date) : null}
                onChange={(date) => updateFilter('deadline_start_date', date?.toISOString())}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Срок до"
                value={filters.deadline_end_date ? dayjs(filters.deadline_end_date) : null}
                onChange={(date) => updateFilter('deadline_end_date', date?.toISOString())}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            {/* Sorting */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Сортировка</InputLabel>
                <Select
                  value={filters.sort_field || 'created_at'}
                  label="Сортировка"
                  onChange={(e) => updateFilter('sort_field', e.target.value)}
                >
                  {SORT_FIELDS.map((field) => (
                    <MenuItem key={field.value} value={field.value}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Порядок</InputLabel>
                <Select
                  value={filters.sort_order || 'desc'}
                  label="Порядок"
                  onChange={(e) => updateFilter('sort_order', e.target.value as 'asc' | 'desc')}
                >
                  <MenuItem value="desc">По убыванию</MenuItem>
                  <MenuItem value="asc">По возрастанию</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}