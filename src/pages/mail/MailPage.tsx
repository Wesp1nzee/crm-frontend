import { useState } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Divider,
  Button,
  Badge,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Inbox,
  Send,
  Drafts,
  Archive,
  Delete,
  Refresh,
  Add,
  Menu,
} from '@mui/icons-material';
import { useMailFolders, useMailThreads, useMailThread } from '../../shared/hooks/useMail';
import { MailViewer } from './MailViewer';
import { MailComposer } from './MailComposer';
import type { MailThread } from '../../entities/mail/types';
import dayjs from 'dayjs';

const DRAWER_WIDTH = 280;

export function MailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedFolderId, setSelectedFolderId] = useState<string>('inbox');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const { data: folders = [] } = useMailFolders();
  const { data: threads = [] } = useMailThreads(selectedFolderId);
  const { data: selectedThread } = useMailThread(selectedThreadId);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleThreadSelect = (thread: MailThread) => {
    setSelectedThreadId(thread.id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            position: 'relative',
            height: '100%',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            fullWidth
            onClick={() => setComposerOpen(true)}
          >
            Написать
          </Button>
        </Box>

        {/* Folders */}
        <List dense>
          {folders.map((folder) => (
            <ListItem
              key={folder.id}
              component="div"
              selected={selectedFolderId === folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon>
                {folder.type === 'inbox' && <Inbox />}
                {folder.type === 'sent' && <Send />}
                {folder.type === 'drafts' && <Drafts />}
                {folder.type === 'archive' && <Archive />}
                {folder.type === 'trash' && <Delete />}
              </ListItemIcon>
              <ListItemText primary={folder.name} />
              {folder.unreadCount > 0 && (
                <Badge badgeContent={folder.unreadCount} color="primary" />
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Thread List */}
      <Box sx={{ width: 400, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setSidebarOpen(true)}>
              <Menu />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {selectedFolder?.name || 'Почта'}
          </Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
        </Box>

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {threads.map((thread) => (
            <ListItem
              key={thread.id}
              component="div"
              selected={selectedThreadId === thread.id}
              onClick={() => handleThreadSelect(thread)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: !thread.isRead ? 'action.hover' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      flexGrow: 1, 
                      fontWeight: !thread.isRead ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {thread.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(thread.lastActivity).format('HH:mm')}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {thread.participants.join(', ')}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Mail Viewer */}
      <Box sx={{ flexGrow: 1 }}>
        {selectedThread ? (
          <MailViewer thread={selectedThread} />
        ) : (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="h6">Выберите письмо для просмотра</Typography>
          </Box>
        )}
      </Box>

      {/* Mail Composer */}
      <MailComposer 
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </Box>
  );
}