import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
  Alert,
  alpha,
} from '@mui/material';
import { Add, AccountBalance, Gavel, PersonOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient } from '../../shared/hooks/useClients';
import { useState } from 'react';
import { ClientCreateDialog } from './ClientCreateDialog';
import { notificationService } from '../../shared/services/notifications';

const TYPE_ICONS = {
  legal: <AccountBalance sx={{ fontSize: 18 }} />,
  individual: <PersonOutline sx={{ fontSize: 18 }} />,
  court: <Gavel sx={{ fontSize: 18 }} />,
};

const PAGE_SIZE = 20;

export function ClientListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: clients, isLoading: clientsLoading, error: clientsError, refetch } = useClients({
    page,
    limit: PAGE_SIZE,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const createClient = useCreateClient();

  const handleCreateClient = async (formData: any) => {
    try {
      await createClient.mutateAsync(formData);
      setCreateDialogOpen(false);
      notificationService.success('Клиент успешно создан');
      refetch();
    } catch (error: any) {
      console.error('Ошибка создания клиента:', error);
      notificationService.error(error?.response?.data?.detail || 'Ошибка создания клиента');
    }
  };

  if (clientsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (clientsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки клиентов: {(clientsError as Error).message}
      </Alert>
    );
  }

  const currentPage = clients?.meta.current_page ?? 1;
  const totalPages = clients?.meta.total_pages ?? 1;
  const totalItems = clients?.meta.total_items ?? 0;
  const hasNext = clients?.meta.has_next ?? false;
  const hasPrev = clients?.meta.has_prev ?? false;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Клиенты</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {totalItems} клиентов
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Добавить клиента
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table sx={{ '& th:first-of-type, & td:first-of-type': { pl: 4 }, '& th:last-of-type, & td:last-of-type': { pr: 4 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Контакты</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>ИНН</TableCell>
              <TableCell>Дела</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients?.items && clients.items.length > 0 ? (
              clients.items.map((client, index) => (
                <TableRow
                  key={client.id}
                  hover
                  onClick={() => navigate(`/crm/clients/${client.id}`)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: (theme) =>
                      index % 2 === 1 ? alpha(theme.palette.common.black, 0.02) : 'transparent',
                  }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium" textAlign="left">
                      {client.name}
                    </Typography>
                    {client.short_name && (
                      <Typography variant="caption" color="text.secondary">
                        {client.short_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{client.email || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {client.phone || 'Телефон не указан'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                      {TYPE_ICONS[client.type]}
                      <Typography variant="body2" color="text.primary">
                        {client.type === 'legal' ? 'ЮЛ' : client.type === 'individual' ? 'ФЛ' : 'Суд'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{client.inn || '—'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Chip label={`${client.active_cases} активных`} size="small" sx={{ bgcolor: 'rgba(79,144,255,0.12)' }} />
                      <Chip label={`${client.total_cases} всего`} size="small" variant="outlined" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/crm/cases?client=${client.id}`);
                      }}
                    >
                      Дела
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="body2" color="text.secondary">
          Страница {currentPage} из {totalPages}
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" disabled={!hasPrev} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
            Назад
          </Button>
          <Button variant="outlined" disabled={!hasNext} onClick={() => setPage((prev) => prev + 1)}>
            Вперед
          </Button>
        </Box>
      </Box>

      <ClientCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />
    </Box>
  );
}
