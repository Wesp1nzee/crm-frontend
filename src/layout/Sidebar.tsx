import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Gavel,
  People,
  Engineering,
  Description,
  AccountBalance,
  Assessment,
} from '@mui/icons-material';

const drawerWidth = 240;
const miniDrawerWidth = 64;

const menuItems = [
  { text: 'Главная', path: '/', icon: <Home /> },
  { text: 'Дела', path: '/cases', icon: <Gavel /> },
  { text: 'Клиенты', path: '/clients', icon: <People /> },
  { text: 'Эксперты', path: '/experts', icon: <Engineering /> },
  { text: 'Документы', path: '/documents', icon: <Description /> },
  { text: 'Финансы', path: '/finance', icon: <AccountBalance /> },
  { text: 'Отчеты', path: '/reports', icon: <Assessment /> },
];

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : miniDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : miniDrawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path || (item.path === '/' && location.pathname === '/')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}