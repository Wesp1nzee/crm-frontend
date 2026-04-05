import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from "@mui/material";
import {
  AccountCircle,
  Menu as MenuIcon,
  Settings,
  ExitToApp,
  Person,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useLogout } from "../shared/hooks/useAuth";
// import dayjs from 'dayjs';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const logout = useLogout();
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = () => {
    logout.mutateAsync();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "rgba(245, 247, 250, 0.78)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.9)",
        color: "text.primary",
        animation: "topbarDropIn 260ms ease",
        "@keyframes topbarDropIn": {
          "0%": { opacity: 0, transform: "translateY(-8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Toolbar>
        {/* Левая часть: меню и заголовок */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{
              mr: 2,
              transition: "transform 180ms ease, background-color 180ms ease",
              "&:hover": { transform: "rotate(-8deg) scale(1.04)" },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 4,
              fontWeight: 700,
              transition: "letter-spacing 220ms ease, opacity 220ms ease",
              "&:hover": {
                letterSpacing: "0.02em",
                opacity: 0.9,
              },
            }}
          >
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
              transition: "transform 0.2s ease, background-color 0.2s ease",
              "&:hover": { transform: "scale(1.08)" },
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
              animation: "profileMenuIn 180ms ease",
              transformOrigin: "top right",
              "@keyframes profileMenuIn": {
                "0%": { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
                "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box
            sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 2 }}
          >
            <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
              {user?.full_name?.charAt(0) || "U"}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.full_name || "Пользователь"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || "user@example.com"}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              handleProfileClose();
              navigate("/crm/profile");
            }}
          >
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="Мой профиль" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleProfileClose();
              navigate("/crm/settings");
            }}
          >
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Настройки" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
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
