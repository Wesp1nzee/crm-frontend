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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient } from '../../shared/hooks/useClients';
import { useState } from 'react';
import { ClientCreateDialog } from './ClientCreateDialog';

const TYPE_ICONS = {
  legal: '🏢',
  individual: '👤',
  court: '⚖️',
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
      refetch();
    } catch (error: any) {
      console.error('Ошибка создания клиента:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
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
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Добавить клиента
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>ИНН</TableCell>
              <TableCell>Активные дела</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients?.items && clients.items.length > 0 ? (
              clients.items.map((client) => {
                return (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {client.name}
                      </Typography>
                      {client.short_name && (
                        <Typography variant="caption" color="text.secondary">
                          {client.short_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{TYPE_ICONS[client.type]}</span>
                        <span>
                          {client.type === 'legal' ? 'ЮЛ' : client.type === 'individual' ? 'ФЛ' : 'Суд'}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell>{client.inn || '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={`${client.active_cases} активных`}
                          color={client.active_cases > 0 ? 'primary' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={`${client.total_cases} всего`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/cases?client=${client.id}`)}
                      >
                        Дела
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <ClientCreateDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />
    </Box>
  );
}