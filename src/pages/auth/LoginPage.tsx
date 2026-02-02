import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { useLogin, useAuth } from '../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const { data: user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/crm', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      navigate('/');
    } catch (error) {
      // Ошибка обрабатывается в UI через login.error
    }
  };

  const getErrorMessage = (error: any) => {
    if (error?.response?.status === 400) return 'Вы уже авторизованы';
    if (error?.response?.status === 401) return 'Неверные учетные данные или доступ запрещен';
    return 'Произошла ошибка при входе';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Вход в CRM
          </Typography>
          
          {login.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(login.error)}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={login.isPending}
            >
              {login.isPending ? 'Вход...' : 'Войти'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}