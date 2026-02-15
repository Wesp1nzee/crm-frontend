import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Gavel,
  People,
  Engineering,
  Description,
  // AccountBalance,
  // CalendarMonth,
  // Calculate,
  // Email
} from '@mui/icons-material';
import { usePermissions } from '../shared/hooks/usePermissions';

const drawerWidth = 244;
const miniDrawerWidth = 84;

const menuItems = [
  { text: 'Главная', path: '/crm', icon: <Home /> },
  { text: 'Дела', path: '/crm/cases', icon: <Gavel /> },
  { text: 'Клиенты', path: '/crm/clients', icon: <People /> },
  { text: 'Эксперты', path: '/crm/experts', icon: <Engineering /> },
  { text: 'Документы', path: '/crm/documents', icon: <Description /> },
  // { text: 'Финансы', path: '/finance', icon: <AccountBalance /> },
  // { text: 'Отчеты', path: '/reports', icon: <Assessment /> },
  // { text: 'Календарь', path: '/calendar', icon: <CalendarMonth /> },
  // { text: 'Расчеты', path: '/calculate', icon: <Calculate /> },
  // { text: 'Почта', path: '/mail', icon: <Email /> },
];

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const location = useLocation();
  const { canAccessRoute } = usePermissions();

  const filteredMenuItems = menuItems.filter(item => canAccessRoute(item.path));

  return (
    <Box sx={{ p: 3, pr: 0, position: 'relative' }}>
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
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.95)',
            backgroundColor: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(25px)',
            p: 1,
            height: 'calc(100% - 48px)',
            top: 24,
            left: 24,
            boxShadow: '0 12px 32px rgba(31, 53, 85, 0.08)',
          },
        }}
      >
      <Toolbar sx={{ minHeight: 56 }} />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path || (item.path === '/' && location.pathname === '/')}
              sx={{
                minHeight: 52,
                justifyContent: open ? 'initial' : 'center',
                px: 2,
                my: 0.5,
                borderRadius: 4,
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 6,
                    top: 12,
                    bottom: 12,
                    width: 4,
                    borderRadius: 4,
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    filter: 'drop-shadow(0 0 10px rgba(79,144,255,0.45))',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  '& svg': {
                    fontSize: 22,
                    strokeWidth: 1.5,
                  },
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
  </Box>
  );
}