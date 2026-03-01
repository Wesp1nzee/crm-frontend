import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useLogin, useAuth } from "../../shared/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../shared/services/notifications";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const { data: user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      navigate("/crm", { replace: true });
    }
  }, [user?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      notificationService.success("Вход выполнен успешно");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const getErrorMessage = () => {
    if (!login.error) return null;

    const error = login.error as any;

    if (error?.message && !error.message.startsWith("Login failed")) {
      return error.message;
    }

    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    const status = error?.response?.status;
    if (status === 400) return "Неверные учетные данные";
    if (status === 401) return "Неверные учетные данные или доступ запрещен";
    if (status === 422) return "Некорректные данные";
    if (status === 500) return "Ошибка сервера";

    return "Произошла ошибка при входе";
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
            Вход в CRM
          </Typography>

          {login.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {getErrorMessage()}
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
              disabled={login.isPending}
              autoComplete="email"
              placeholder="example@example.com"
            />

            <TextField
              fullWidth
              label="Пароль"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              disabled={login.isPending}
              autoComplete="current-password"
              placeholder="Введите ваш пароль"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      onMouseDown={handleClickShowPassword}
                      edge="end"
                      disabled={login.isPending}
                      title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={login.isPending || !email.trim() || !password.trim()}
              sx={{ py: 1.5 }}
            >
              {login.isPending ? "Вход..." : "Войти"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
