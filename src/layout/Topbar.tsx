import { AppBar, Toolbar, Typography, TextField, Badge, IconButton, Box } from '@mui/material';
import { Search, Notifications, AccountCircle, Menu } from '@mui/icons-material';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <Menu />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ mr: 4 }}>
          CRM Экспертиза
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}