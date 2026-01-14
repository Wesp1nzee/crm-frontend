import { useState } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Button,
  Badge,
  useMediaQuery,
  useTheme,
  Chip,
  Avatar,
  TextField,
  FormControlLabel,
  Switch,
  Drawer
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
  ArrowBack,
  Search,
  AttachFile,
  Send as SendIcon,
  MoreVert
} from '@mui/icons-material';
import { MailComposer } from './MailComposer';

const MailPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [folders] = useState([
    { id: 'inbox', name: 'Входящие', type: 'inbox', unreadCount: 5 },
    { id: 'sent', name: 'Отправленные', type: 'sent', unreadCount: 0 },
    { id: 'drafts', name: 'Черновики', type: 'drafts', unreadCount:  2 },
    { id: 'archive', name: 'Архив', type: 'archive', unreadCount: 0 },
    { id: 'spam', name: 'Спам', type: 'spam', unreadCount: 3 }
  ]);
  
  const [threads] = useState([
    {
      id: '1',
      subject: 'Срочно:  Осмотр объекта по делу ЭКС-2024-001',
      participants: ['client@stroyinvest.ru', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'high',
      hasAttachments: true,
      preview: 'Добрый день! Просим назначить осмотр объекта на ближайшее время.  Дело срочное.. .',
      folder: 'inbox'
    },
    {
      id: '2',
      subject: 'Запрос дополнительных документов',
      participants: ['ivanov@mail.ru', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      priority: 'normal',
      hasAttachments:  false,
      preview: 'Необходимо предоставить дополнительные документы для завершения экспертизы.. .',
      folder: 'inbox'
    },
    {
      id: '3',
      subject: 'Отчет по экспертизе готов',
      participants: ['expert@company.ru', 'manager@client.com'],
      lastActivity: new Date(Date.now() - 86400000).toISOString(),
      isRead: false,
      priority: 'normal',
      hasAttachments: true,
      preview: 'Уведомляю, что отчет по экспертизе объекта №ЭКС-2024-005 готов для ознакомления.. .',
      folder: 'sent'
    },
    {
      id: '4',
      subject: 'Подтверждение встречи',
      participants: ['meeting@calendar.com', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
      priority: 'normal',
      hasAttachments:  false,
      preview: 'Ваша встреча подтверждена',
      folder: 'drafts'
    },
    {
      id: '5',
      subject: 'Архивное письмо',
      participants: ['old@mail.ru'],
      lastActivity: new Date(Date.now() - 2592000000).toISOString(),
      isRead: true,
      priority: 'low',
      hasAttachments:  false,
      preview: 'Это старое письмо',
      folder: 'archive'
    },
    {
      id: '6',
      subject: 'Спам сообщение',
      participants: ['spam@evil.ru'],
      lastActivity: new Date(Date.now() - 1000000).toISOString(),
      isRead: false,
      priority:  'low',
      hasAttachments:  false,
      preview: 'Купи здесь! ',
      folder: 'spam'
    }
  ]);

  // Фильтруем письма по выбранной папке
  const filteredThreads = threads.filter(thread => 
    thread.folder === selectedFolder && 
    (! showUnreadOnly || ! thread.isRead)
  );

  const handleComposerOpen = () => {
    setComposerOpen(true);
  };

  const handleComposerClose = () => {
    setComposerOpen(false);
  };

  const handleFolderClick = (folderId) => {
    setSelectedFolder(folderId);
    setSelectedThread(null);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleThreadClick = (thread) => {
    setSelectedThread(thread);
  };

  const handleBackToList = () => {
    setSelectedThread(null);
  };

  const handleSendMail = async (formData) => {
    console.log('Отправляю письмо:', formData);
    // Здесь должен быть вызов API
    handleComposerClose();
  };

  const drawer = (
    <div>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Почта</Typography>
      </Box>
      <List>
        <ListItem disablePadding>
          <Button 
            startIcon={<Add />} 
            variant="contained" 
            fullWidth
            onClick={handleComposerOpen}
            sx={{ m: 1 }}
          >
            Написать
          </Button>
        </ListItem>
        <Divider />
        {folders.map((folder) => (
          <ListItem key={folder.id} disablePadding>
            <Button
              startIcon={
                folder.id === 'inbox' ? (
                  <Badge badgeContent={folder.unreadCount} color="error">
                    <Inbox />
                  </Badge>
                ) : folder.id === 'sent' ? (
                  <Send />
                ) : folder.id === 'drafts' ? (
                  <Drafts />
                ) : folder.id === 'archive' ?  (
                  <Archive />
                ) : (
                  <Delete />
                )
              }
              fullWidth
              onClick={() => handleFolderClick(folder.id)}
              sx={{ 
                justifyContent: 'flex-start', 
                px: 2, 
                py: 1,
                ...(selectedFolder === folder.id && { backgroundColor: 'action.selected' })
              }}
            >
              <ListItemText primary={folder.name} />
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <List>
        <ListItem>
          <FormControlLabel
            control={
              <Switch
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                color="primary"
              />
            }
            label="Только непрочитанные"
          />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {! isMobile && (
        <Box sx={{ width: 280, bgcolor: 'background.paper', borderRight: 1, borderColor:  'divider' }}>
          {drawer}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        >
          <Box sx={{ width: 280 }}>
            {drawer}
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection:  'column', overflow: 'hidden' }}>
        {! selectedThread ? (
          <>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor:  'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)}>
                  <Menu />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {folders.find(f => f.id === selectedFolder)?.name}
              </Typography>
              <IconButton>
                <Refresh />
              </IconButton>
              <IconButton>
                <Search />
              </IconButton>
            </Box>

            {/* Threads List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {filteredThreads.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  Нет писем в этой папке
                </Typography>
              ) : (
                <List sx={{ display: 'flex', flexDirection:  'column', gap: 1 }}>
                  {filteredThreads.map((thread) => (
                    <Paper
                      key={thread.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderLeft: thread.isRead ? 'none' : '4px solid',
                        borderLeftColor: 'primary.main'
                      }}
                      onClick={() => handleThreadClick(thread)}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          {thread. participants[0]?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: thread.isRead ? 400 : 700 }}>
                              {thread.subject}
                            </Typography>
                            <Chip 
                              label={thread.priority === 'high' ? 'Срочно' : 'Обычная'} 
                              size="small"
                              color={thread.priority === 'high' ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {thread.participants. join(', ')}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                            {thread.preview}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                            {thread.hasAttachments && <AttachFile fontSize="small" color="action" />}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(thread.lastActivity).toLocaleString('ru-RU')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          </>
        ) : (
          <>
            {/* Thread Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={handleBackToList}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {selectedThread.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedThread.participants.join(', ')}
                </Typography>
              </Box>
              <IconButton>
                <MoreVert />
              </IconButton>
            </Box>

            {/* Thread Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {selectedThread.participants[0]?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {selectedThread.participants[0]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(selectedThread.lastActivity).toLocaleString('ru-RU')}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1">
                  {selectedThread.preview}
                </Typography>
              </Paper>
            </Box>

            {/* Reply Box */}
            <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button startIcon={<AttachFile />} variant="outlined" size="small">
                  Прикрепить
                </Button>
                <Button startIcon={<SendIcon />} variant="contained" size="small">
                  Ответить
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Напишите ваш ответ..."
                variant="outlined"
                size="small"
              />
            </Paper>
          </>
        )}
      </Box>

      {/* Mail Composer Dialog */}
      <MailComposer 
        open={composerOpen}
        onClose={handleComposerClose}
      />
    </Box>
  );
};

export { MailPage };