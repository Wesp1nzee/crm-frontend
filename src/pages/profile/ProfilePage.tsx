import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  Grid,
  Divider,
  Alert
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';

export function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Иванов Иван Иванович',
    position: 'Генеральный директор',
    email: 'director@company.ru',
    phone: '+7 495 123-45-67',
    company: 'ООО "Экспертиза Плюс"',
    address: 'г. Москва, ул. Тверская, д. 10',
  });

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Мой профиль
      </Typography>
      
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Профиль успешно обновлен
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}>
            ГД
          </Avatar>
          <Box>
            <Typography variant="h5">{profile.name}</Typography>
            <Typography color="text.secondary">{profile.position}</Typography>
          </Box>
          <Box ml="auto">
            {!editing ? (
              <Button startIcon={<Edit />} onClick={() => setEditing(true)}>
                Редактировать
              </Button>
            ) : (
              <Box display="flex" gap={1}>
                <Button startIcon={<Save />} variant="contained" onClick={handleSave}>
                  Сохранить
                </Button>
                <Button startIcon={<Cancel />} onClick={() => setEditing(false)}>
                  Отмена
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="ФИО"
              fullWidth
              value={profile.name}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Должность"
              fullWidth
              value={profile.position}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, position: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              fullWidth
              value={profile.email}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Телефон"
              fullWidth
              value={profile.phone}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Компания"
              fullWidth
              value={profile.company}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, company: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Адрес"
              fullWidth
              multiline
              rows={2}
              value={profile.address}
              disabled={!editing}
              onChange={(e) => setProfile({...profile, address: e.target.value})}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}