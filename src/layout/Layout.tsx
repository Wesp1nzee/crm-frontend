import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from '../shared/ui/Breadcrumbs';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const isHomePage = pathname === '/crm';

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Topbar onMenuClick={handleMenuClick} />
      <Sidebar open={sidebarOpen} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 },
          width: '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, md: 4 },
          pb: { xs: 3, md: 4 },
          animation: 'mainFadeIn 320ms ease',
          '@keyframes mainFadeIn': {
            '0%': { opacity: 0, transform: 'translateY(6px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Toolbar />
        {!isHomePage && (
          <Box sx={{ mb: 2, animation: 'mainFadeIn 360ms ease' }}>
            <Breadcrumbs />
          </Box>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
