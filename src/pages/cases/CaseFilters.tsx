// src/pages/cases/CaseFilters.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
} from "@mui/material";
import { Search, Clear, ExpandMore, ExpandLess } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useExperts } from "../../shared/hooks/useExperts";
import { useClients } from "../../shared/hooks/useClients";
import type { GetCasesQuery, CaseStatus } from "../../entities/case/types";

const CASE_STATUSES: { value: CaseStatus; label: string }[] = [
  { value: "archive", label: "Архив" },
  { value: "in_work", label: "В работе" },
  { value: "debt", label: "Долг" },
  { value: "executed", label: "Выполнено" },
  { value: "withdrawn", label: "Отозвано" },
  { value: "cancelled", label: "Отменено" },
  { value: "fssp", label: "ФССП" },
];

const premiumFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 48,
  },
};

interface CaseFiltersProps {
  filters: GetCasesQuery;
  onFiltersChange: (filters: GetCasesQuery) => void;
  onClear?: () => void;
}

export function CaseFilters({ filters, onFiltersChange, onClear }: CaseFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: expertsData } = useExperts();
  const experts = expertsData?.items ?? [];
  const { data: clients } = useClients();

  const updateFilter = (key: keyof GetCasesQuery, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 }); // 👈 сброс на 1 страницу при изменении фильтра
  };

  const clearFilters = () => {
    if (onClear) {
      onClear();
    } else {
      onFiltersChange({ page: 1, limit: filters.limit });
    }
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      key !== "page" && 
      key !== "limit" && 
      filters[key as keyof GetCasesQuery] &&
      // Исключаем дефолтную сортировку из "активных фильтров"
      !(key === "sort_field" && filters[key] === "number") &&
      !(key === "sort_order" && filters[key] === "desc"),
  );

  return (
    <Paper sx={{ p: 2.5, mb: 3, borderRadius: 4 }}>
      {/* Basic Filters */}
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            sx={premiumFieldSx}
            placeholder="Поиск по всем полям..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
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
            sx={premiumFieldSx}
            options={CASE_STATUSES}
            getOptionLabel={(option) => option.label}
            value={
              CASE_STATUSES.filter((s) => filters.status?.includes(s.value)) ||
              []
            }
            onChange={(_, value) =>
              updateFilter(
                "status",
                value.map((v) => v.value),
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Статус" sx={premiumFieldSx} />
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
          <FormControl fullWidth size="small" sx={premiumFieldSx}>
            <InputLabel>Эксперт</InputLabel>
            <Select
              value={filters.expert_id || ""}
              label="Эксперт"
              onChange={(e) =>
                updateFilter("expert_id", e.target.value || undefined)
              }
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
              color={expanded ? "primary" : "default"}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            {hasActiveFilters && (
              <Button size="small" startIcon={<Clear />} onClick={clearFilters}>
                Очистить
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="subtitle2" gutterBottom>
            Расширенные фильтры
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small" sx={premiumFieldSx}>
                <InputLabel>Клиент</InputLabel>
                <Select
                  value={filters.client_id || ""}
                  label="Клиент"
                  onChange={(e) =>
                    updateFilter("client_id", e.target.value || undefined)
                  }
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

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Тип дела"
                value={filters.case_type || ""}
                onChange={(e) => updateFilter("case_type", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Тип объекта"
                value={filters.object_type || ""}
                onChange={(e) => updateFilter("object_type", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Орган власти"
                value={filters.authority || ""}
                onChange={(e) => updateFilter("authority", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Адрес объекта"
                value={filters.object_address || ""}
                onChange={(e) => updateFilter("object_address", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Номер дела"
                value={filters.number || ""}
                onChange={(e) => updateFilter("number", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                label="Номер производства"
                value={filters.case_number || ""}
                onChange={(e) => updateFilter("case_number", e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                type="number"
                label="Мин. стоимость"
                value={filters.min_cost || ""}
                onChange={(e) =>
                  updateFilter(
                    "min_cost",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                sx={premiumFieldSx}
                type="number"
                label="Макс. стоимость"
                value={filters.max_cost || ""}
                onChange={(e) =>
                  updateFilter(
                    "max_cost",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Дата начала от"
                value={filters.start_date ? dayjs(filters.start_date) : null}
                onChange={(date) =>
                  updateFilter("start_date", date?.toISOString())
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: premiumFieldSx,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Дата начала до"
                value={filters.end_date ? dayjs(filters.end_date) : null}
                onChange={(date) =>
                  updateFilter("end_date", date?.toISOString())
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: premiumFieldSx,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Срок от"
                value={
                  filters.deadline_start_date
                    ? dayjs(filters.deadline_start_date)
                    : null
                }
                onChange={(date) =>
                  updateFilter("deadline_start_date", date?.toISOString())
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: premiumFieldSx,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Срок до"
                value={
                  filters.deadline_end_date
                    ? dayjs(filters.deadline_end_date)
                    : null
                }
                onChange={(date) =>
                  updateFilter("deadline_end_date", date?.toISOString())
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: premiumFieldSx,
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}