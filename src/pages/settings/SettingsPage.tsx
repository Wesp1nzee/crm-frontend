import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Switch, 
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import { Save, Notifications, Security, Palette } from '@mui/icons-material';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      deadlines: true,
      newCases: false,
    },
    system: {
      theme: 'light',
      language: 'ru',
      autoSave: true,
      compactView: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 60,
      passwordExpiry: 90,
    }
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Настройки системы
      </Typography>
      
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Настройки сохранены
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Notifications sx={{ mr: 1 }} />
          <Typography variant="h6">Уведомления</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <FormControlLabel
          control={
            <Switch 
              checked={settings.notifications.email}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {...settings.notifications, email: e.target.checked}
              })}
            />
          }
          label="Email уведомления"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={settings.notifications.push}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {...settings.notifications, push: e.target.checked}
              })}
            />
          }
          label="Push уведомления"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={settings.notifications.deadlines}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {...settings.notifications, deadlines: e.target.checked}
              })}
            />
          }
          label="Уведомления о сроках"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={settings.notifications.newCases}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {...settings.notifications, newCases: e.target.checked}
              })}
            />
          }
          label="Новые дела"
        />
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Palette sx={{ mr: 1 }} />
          <Typography variant="h6">Интерфейс</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Box display="flex" gap={2} mb={2}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Тема</InputLabel>
            <Select
              value={settings.system.theme}
              label="Тема"
              onChange={(e) => setSettings({
                ...settings,
                system: {...settings.system, theme: e.target.value}
              })}
            >
              <MenuItem value="light">Светлая</MenuItem>
              <MenuItem value="dark">Темная</MenuItem>
              <MenuItem value="auto">Авто</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Язык</InputLabel>
            <Select
              value={settings.system.language}
              label="Язык"
              onChange={(e) => setSettings({
                ...settings,
                system: {...settings.system, language: e.target.value}
              })}
            >
              <MenuItem value="ru">Русский</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <FormControlLabel
          control={
            <Switch 
              checked={settings.system.autoSave}
              onChange={(e) => setSettings({
                ...settings,
                system: {...settings.system, autoSave: e.target.checked}
              })}
            />
          }
          label="Автосохранение"
        />
        <FormControlLabel
          control={
            <Switch 
              checked={settings.system.compactView}
              onChange={(e) => setSettings({
                ...settings,
                system: {...settings.system, compactView: e.target.checked}
              })}
            />
          }
          label="Компактный вид"
        />
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Security sx={{ mr: 1 }} />
          <Typography variant="h6">Безопасность</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <FormControlLabel
          control={
            <Switch 
              checked={settings.security.twoFactor}
              onChange={(e) => setSettings({
                ...settings,
                security: {...settings.security, twoFactor: e.target.checked}
              })}
            />
          }
          label="Двухфакторная аутентификация"
        />
        
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="Таймаут сессии (мин)"
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => setSettings({
              ...settings,
              security: {...settings.security, sessionTimeout: Number(e.target.value)}
            })}
            sx={{ width: 200 }}
          />
          <TextField
            label="Срок действия пароля (дни)"
            type="number"
            value={settings.security.passwordExpiry}
            onChange={(e) => setSettings({
              ...settings,
              security: {...settings.security, passwordExpiry: Number(e.target.value)}
            })}
            sx={{ width: 200 }}
          />
        </Box>
      </Paper>
      
      <Button 
        variant="contained" 
        startIcon={<Save />}
        onClick={handleSave}
        size="large"
      >
        Сохранить настройки
      </Button>
    </Box>
  );
}