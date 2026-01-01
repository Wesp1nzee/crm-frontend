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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useClients, useCases } from '../../shared/hooks/useCases';

export function ClientListPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const { data: cases } = useCases();

  if (clientsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (clientsError) {
    return (
      <Typography color="error" align="center">
        Ошибка загрузки клиентов
      </Typography>
    );
  }

  const getClientCases = (clientId: string) => {
    return cases?.filter(case_ => case_.clientId === clientId) || [];
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Клиенты
        </Typography>
        <Button variant="contained" color="primary">
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
              <TableCell>Активные дела</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients?.map((client) => {
              const clientCases = getClientCases(client.id);
              const activeCases = clientCases.filter(c => !['done', 'closed'].includes(c.status));
              
              return (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {client.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Chip 
                        label={`${activeCases.length} активных`}
                        color={activeCases.length > 0 ? 'primary' : 'default'}
                        size="small"
                      />
                      <Chip 
                        label={`${clientCases.length} всего`}
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
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}