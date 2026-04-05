import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";

interface PasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error?: string;
}

/**
 * Modal dialog for entering a password to access a protected share.
 * NOTE: The password is sent as `Authorization: Bearer {password}` header
 * or as `?password=...` query param depending on backend configuration.
 * Currently the implementation stores it in the parent component's state
 * which then passes it to API calls as a header.
 */
export function PasswordDialog({ open, onClose, onSubmit, error }: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px" },
      }}
    >
      <DialogTitle sx={{ pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
        <Lock sx={{ color: "#4f46e5" }} />
        Требуется пароль
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Эта ссылка защищена паролем. Введите пароль для доступа к файлам.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          type={showPassword ? "text" : "password"}
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!password.trim()}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "#4f46e5",
            "&:hover": { bgcolor: "#4338ca" },
          }}
        >
          Открыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}
