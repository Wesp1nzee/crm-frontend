import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../shared/hooks/useClients';
import { useCases, usePatchCase } from '../../shared/hooks/useCases';
import { useExpertsSuggest } from '../../shared/hooks/useExpertsSuggest';
import { notificationService } from '../../shared/services/notifications';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isClientLoading, error: clientError } = useClient(id!);
  const { data: casesResponse, isLoading: isCasesLoading, error: casesError, refetch } = useCases({ client_id: id });
  const patchCase = usePatchCase();

  const { suggestions, isLoading: isSuggestLoading, fetchSuggestions, clearSuggestions } = useExpertsSuggest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<{ id: string; name: string } | null>(null);
  const [expertInputValue, setExpertInputValue] = useState('');

  const cases = casesResponse?.data ?? [];

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedCaseId) ?? null, [cases, selectedCaseId]);

  const openExpertDialog = (caseItem: (typeof cases)[number]) => {
    setSelectedCaseId(caseItem.id);
    if (caseItem.assigned_expert) {
      setSelectedExpert({ id: caseItem.assigned_expert.id, name: caseItem.assigned_expert.full_name });
      setExpertInputValue(caseItem.assigned_expert.full_name);
    } else {
      setSelectedExpert(null);
      setExpertInputValue('');
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedCaseId(null);
    setSelectedExpert(null);
    setExpertInputValue('');
    clearSuggestions();
  };

  const handleSaveExpert = async () => {
    if (!selectedCase) return;

    try {
      await patchCase.mutateAsync({
        id: selectedCase.id,
        data: { assigned_user_id: selectedExpert?.id ?? null },
      });
      notificationService.success('Эксперт успешно изменён');
      closeDialog();
      refetch();
    } catch {
      notificationService.error('Не удалось изменить эксперта');
    }
  };

  if (isClientLoading || isCasesLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (clientError || !client) {
    return <Alert severity="error">Не удалось загрузить клиента</Alert>;
  }

  if (casesError) {
    return <Alert severity="error">Не удалось загрузить дела клиента</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">{client.name}</Typography>
          <Typography variant="body2" color="text.secondary">ID: {client.id}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/crm/clients')}>К списку клиентов</Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Дела клиента</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>№ п/п</TableCell>
                  <TableCell>Номер дела</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Эксперт</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">У клиента пока нет дел</TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow key={caseItem.id} hover>
                      <TableCell>{caseItem.number}</TableCell>
                      <TableCell>{caseItem.case_number}</TableCell>
                      <TableCell>{caseItem.status}</TableCell>
                      <TableCell>{caseItem.assigned_expert?.full_name ?? 'Не назначен'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" onClick={() => openExpertDialog(caseItem)}>
                          Изменить эксперта
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Изменить эксперта</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            {selectedCase ? `Дело: ${selectedCase.case_number}` : ''}
          </Typography>
          <Autocomplete
            fullWidth
            options={suggestions}
            value={selectedExpert}
            inputValue={expertInputValue}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            filterOptions={(options) => options}
            loading={isSuggestLoading}
            noOptionsText={
              expertInputValue.trim().length === 0
                ? 'Начните ввод для поиска...'
                : isSuggestLoading
                ? 'Поиск...'
                : 'Эксперты не найдены'
            }
            onInputChange={(_e, value, reason) => {
              setExpertInputValue(value);
              if (reason === 'clear') {
                clearSuggestions();
              }
              if (reason === 'input') {
                fetchSuggestions(value);
              }
            }}
            onChange={(_e, value) => {
              setSelectedExpert(value);
              setExpertInputValue(value?.name ?? '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Эксперт"
                placeholder="Введите имя эксперта..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSuggestLoading ? <CircularProgress size={18} color="inherit" /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Отмена</Button>
          <Button onClick={handleSaveExpert} variant="contained" disabled={patchCase.isPending}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
