import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

export function ClientListPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading, error: clientsError, refetch } = useClients();

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Клиенты</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {clients?.items?.length || 0} клиентов
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Добавить клиента
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table sx={{ "& th:first-of-type, & td:first-of-type": { pl: 4 }, "& th:last-of-type, & td:last-of-type": { pr: 4 } }}>
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
                  sx={{
                    backgroundColor: (theme) =>
                      index % 2 === 1 ? alpha(theme.palette.common.black, 0.02) : 'transparent',
                  }}
                >
                  <TableCell>
                    <Button variant="text" sx={{ p: 0, minWidth: 0, textTransform: 'none' }} onClick={() => navigate(`/crm/clients/${client.id}`)}>
                      <Typography variant="body1" fontWeight="medium" textAlign="left">
                        {client.name}
                      </Typography>
                    </Button>
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
                    <Button size="small" onClick={() => navigate(`/crm/cases?client=${client.id}`)}>
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

      <ClientCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />
    </Box>
  );
}
