import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Gavel,
  Add,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCases } from '../shared/hooks/useCases';
import { usePermissions } from '../shared/hooks/usePermissions';

export function ExpertHomePage() {
  const navigate = useNavigate();
  const { data: cases } = useCases();
  const { user } = usePermissions();

  // Убедимся, что cases - это массив перед фильтрацией
  const casesArray = Array.isArray(cases) ? cases : [];
  
  // Фильтруем дела только для текущего эксперта
  const expertCases = casesArray.filter(c => c.assignedExpertId === user?.id);
  const activeCases = expertCases.filter(c => !['done', 'closed'].includes(c.status));
  const recentCases = expertCases.slice(0, 5);

  return (
    <Box sx={{ width: '100%', maxWidth: 'none' }}>
      <Box mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Добро пожаловать, {user?.full_name}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {dayjs().format('DD MMMM YYYY')} • Ваши дела
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 3,
          mb: 4
        }}
      >
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{activeCases.length}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Активных дел</Typography>
              </Box>
              <Gavel sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">Быстрые действия</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<Add />} 
                fullWidth 
                onClick={() => navigate('/cases')} 
                sx={{ py: 1.5 }}
              >
                Мои дела
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Мои последние дела</Typography>
            <Button 
              endIcon={<ArrowForward />}
              onClick={() => navigate('/cases')}
            >
              Все дела
            </Button>
          </Box>
          {recentCases.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              У вас пока нет назначенных дел
            </Typography>
          ) : (
            <List>
              {recentCases.map((case_) => (
                <ListItem 
                  key={case_.id}
                  sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/cases/${case_.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}><Gavel /></Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={case_.caseNumber}
                    secondary={case_.objectAddress}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <Chip 
                    size="small" 
                    label={dayjs(case_.deadline).format('DD.MM')}
                    color={dayjs(case_.deadline).isBefore(dayjs(), 'day') ? 'error' : 'default'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}