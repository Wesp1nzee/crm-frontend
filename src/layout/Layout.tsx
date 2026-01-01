import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from '../shared/ui/Breadcrumbs';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar onMenuClick={handleMenuClick} />
      <Sidebar open={sidebarOpen} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Breadcrumbs />
        <Outlet />
      </Box>
    </Box>
  );
}