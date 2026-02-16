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
const sidebarInset = 24;

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
  const sidebarWidth = open ? drawerWidth : miniDrawerWidth;

  return (
    <Box sx={{ p: 0, position: 'relative', width: sidebarWidth, flexShrink: 0 }}>
      <Drawer
        variant="permanent"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease, border-radius 0.25s ease, box-shadow 0.25s ease',
            overflowX: 'hidden',
            borderRadius: open ? 0 : 8,
            border: '1px solid rgba(255,255,255,0.95)',
            backgroundColor: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(25px)',
            p: 1,
            top: sidebarInset,
            left: 0,
            boxShadow: '0 12px 32px rgba(31, 53, 85, 0.08)',
            bottom: sidebarInset,
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
                alignItems: 'center',
                justifyContent: 'center',
                px: 0,
                my: 0.5,
                borderRadius: 4,
                transition: 'transform 200ms ease, background-color 200ms ease',
                '&:hover': {
                  transform: 'translateX(2px)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    boxShadow: 'inset 0 0 22px rgba(79,144,255,0.16)',
                  },
                  '& .MuiListItemIcon-root': {
                    filter: 'drop-shadow(0 0 6px rgba(79,144,255,0.35))',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 'unset',
                  width: 'fit-content',
                  height: 'fit-content',
                  mr: open ? 2 : 0,
                  ml: open ? 2 : 0,
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '& svg': {
                    fontSize: 22,
                    strokeWidth: 1.2,
                    display: 'block',
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: 500, lineHeight: 1.2 }}
                  sx={{ my: 0, mr: 2 }} 
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  </Box>
  );
}
