import { AppBar, Toolbar, Typography, TextField, Badge, IconButton, Box, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Avatar, Chip } from '@mui/material';
import { Search, Notifications, AccountCircle, Menu as MenuIcon, Settings, ExitToApp, Person, CheckCircle, Warning, Info } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../shared/hooks/useAuth';
// import dayjs from 'dayjs';

interface TopbarProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Просроченный срок',
    message: 'Дело ЭКС-2024-001 просрочено на 2 дня',
    time: '2024-01-28T10:30:00Z',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Дело завершено',
    message: 'Эксперт Петров П.П. завершил дело ЭКС-2024-003',
    time: '2024-01-28T09:15:00Z',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Новый клиент',
    message: 'Зарегистрирован новый клиент ООО "Строй Плюс"',
    time: '2024-01-27T16:45:00Z',
    read: true,
  },
];

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const logout = useLogout();
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = () => {
    logout.mutateAsync();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <Warning color="warning" />;
      case 'success': return <CheckCircle color="success" />;
      case 'info': return <Info color="info" />;
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Левая часть: меню и заголовок */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ mr: 4 }}>
            CRM
          </Typography>
        </Box>

        {/* Пустое пространство для растягивания */}
        <Box sx={{ flexGrow: 1 }} />

        {/* TODO Доделать поиск (если нужно будет разместить в центре) */}
        {/* 
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Search sx={{ mr: 1 }} />
          <TextField
            placeholder="Поиск по номеру дела или адресу..."
            variant="outlined"
            size="small"
            sx={{ 
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
          />
        </Box>
        */}

        {/* Правая часть: иконки уведомлений и профиля */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Раскомментируйте, если нужно показать уведомления
          <IconButton 
            color="inherit" 
            onClick={handleNotificationClick}
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          */}
          
          <IconButton 
            color="inherit" 
            onClick={handleProfileClick}
            sx={{
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.1)' }
            }}
          >
            <AccountCircle />
          </IconButton>
        </Box>

        {/* Меню уведомлений */}
        {/* <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 400,
              maxHeight: 500,
              mt: 1,
              '& .MuiMenuItem-root': {
                whiteSpace: 'normal',
                alignItems: 'flex-start',
                py: 1.5,
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Уведомления</Typography>
            {unreadCount > 0 && (
              <Chip 
                label={`Отметить все как прочитанные`} 
                size="small" 
                onClick={markAllAsRead}
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography color="text.secondary">Нет уведомлений</Typography>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={() => markAsRead(notification.id)}
                sx={{ 
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': { backgroundColor: 'action.selected' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(notification.time).format('HH:mm')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                  }
                />
              </MenuItem>
            ))
          )}
        </Menu> */}

        {/* Меню профиля */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={handleProfileClose}
          PaperProps={{
            sx: {
              width: 280,
              mt: 1,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.full_name || 'Пользователь'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleProfileClose(); navigate('/profile'); }}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="Мой профиль" />
          </MenuItem>
          <MenuItem onClick={() => { handleProfileClose(); navigate('/settings'); }}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Настройки" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <ExitToApp color="error" />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}