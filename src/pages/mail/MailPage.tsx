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
  useMediaQuery,
  useTheme,
  Chip,
  Avatar,
  Collapse,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip
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
  MoreVert,
  Markunread,
  DoneAll
} from '@mui/icons-material';

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [folders, setFolders] = useState([
    { id: 'inbox', name: 'Входящие', type: 'inbox', unreadCount: 5 },
    { id: 'sent', name: 'Отправленные', type: 'sent', unreadCount: 0 },
    { id: 'drafts', name: 'Черновики', type: 'drafts', unreadCount: 2 },
    { id: 'archive', name: 'Архив', type: 'archive', unreadCount: 0 },
    { id: 'spam', name: 'Спам', type: 'spam', unreadCount: 3 }
  ]);
  
  const [threads, setThreads] = useState([
    {
      id: '1',
      subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
      participants: ['client@stroyinvest.ru', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'high',
      hasAttachments: true,
      preview: 'Добрый день! Просим назначить осмотр объекта на ближайшее время. Дело срочное...'
    },
    {
      id: '2',
      subject: 'Запрос дополнительных документов',
      participants: ['ivanov@mail.ru', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      priority: 'normal',
      hasAttachments: false,
      preview: 'Необходимо предоставить дополнительные документы для завершения экспертизы...'
    },
    {
      id: '3',
      subject: 'Отчет по экспертизе готов',
      participants: ['expert@company.ru', 'manager@client.com'],
      lastActivity: new Date(Date.now() - 86400000).toISOString(),
      isRead: false,
      priority: 'normal',
      hasAttachments: true,
      preview: 'Уведомляю, что отчет по экспертизе объекта №ЭКС-2024-005 готов для ознакомления...'
    },
    {
      id: '4',
      subject: 'Подтверждение встречи',
      participants: ['meeting@calendar.com', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
      priority: 'low',
      hasAttachments: false,
      preview: 'Напоминаем о предстоящей встрече в четверг в 14:00 по вопросам текущих экспертиз...'
    },
    {
      id: '5',
      subject: 'Новый клиент - ООО "Строй Плюс"',
      participants: ['admin@company.ru', 'director@company.ru'],
      lastActivity: new Date(Date.now() - 259200000).toISOString(),
      isRead: true,
      priority: 'normal',
      hasAttachments: false,
      preview: 'Зарегистрирован новый клиент ООО "Строй Плюс", контактное лицо - Иванов И.И....'
    }
  ]);

  const [mailContent, setMailContent] = useState({
    id: '1',
    subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
    participants: [
      { email: 'client@stroyinvest.ru', name: 'ООО "СтройИнвест"' },
      { email: 'director@company.ru', name: 'Генеральный директор' }
    ],
    lastActivity: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    priority: 'high',
    hasAttachments: true,
    mails: [
      {
        id: '1',
        from: 'client@stroyinvest.ru',
        to: ['director@company.ru'],
        subject: 'Срочно: Осмотр объекта по делу ЭКС-2024-001',
        body: `
          <p>Добрый день!</p>
          <p>Просим назначить осмотр объекта на ближайшее время. Дело срочное.</p>
          <p>Объект: Жилой дом по адресу: г. Москва, ул. Тверская, д. 1</p>
          <p>Номер дела: ЭКС-2024-001</p>
          <p>Прошу рассмотреть возможность проведения осмотра в течение недели.</p>
          <br/>
          <p>С уважением,<br/>Иванов И.И.<br/>ООО "СтройИнвест"</p>
        `,
        attachments: [
          { id: '1', name: 'tech-specification.pdf', size: '1.2 MB' },
          { id: '2', name: 'site-plan.jpg', size: '3.4 MB' }
        ],
        receivedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        from: 'director@company.ru',
        to: ['client@stroyinvest.ru'],
        subject: 'Re: Срочно: Осмотр объекта по делу ЭКС-2024-001',
        body: `
          <p>Здравствуйте!</p>
          <p>Осмотр назначен на завтра в 10:00. Эксперт Петров П.П. свяжется с вами.</p>
          <p>Будем на месте к 10:00, подготовьте доступ к объекту.</p>
          <br/>
          <p>С уважением,<br/>Петров П.П.<br/>Генеральный директор</p>
        `,
        attachments: [],
        receivedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUnread = showUnreadOnly ? !thread.isRead : true;
    return matchesSearch && matchesUnread;
  });

  const handleThreadClick = (thread) => {
    setSelectedThread(thread);
    // Mark as read when opened
    if (!thread.isRead) {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? {...t, isRead: true} : t
      ));
    }
  };

  const handleBackToList = () => {
    setSelectedThread(null);
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
                ) : folder.id === 'sent' ? <Send /> :
                   folder.id === 'drafts' ? <Drafts /> :
                   folder.id === 'archive' ? <Archive /> :
                   <Delete />
              }
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                px: 2, 
                py: 1,
                ...(folder.id === 'inbox' && { backgroundColor: 'action.selected' })
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

  const mailItem = (mail, index) => (
    <Paper 
      key={mail.id} 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: index === 0 ? 'background.default' : 'background.paper'
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
              {mail.from.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{mail.from}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(mail.receivedAt).toLocaleString('ru-RU')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small">
              <Markunread />
            </IconButton>
            <IconButton size="small">
              <Archive />
            </IconButton>
            <IconButton size="small">
              <Delete />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ mt: 1 }}>
          <div dangerouslySetInnerHTML={{ __html: mail.body }} />
        </Box>
        
        {mail.attachments && mail.attachments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Вложения ({mail.attachments.length})</Typography>
            <List dense>
              {mail.attachments.map(att => (
                <ListItem key={att.id} sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <AttachFile fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={att.name} 
                    secondary={`${att.size}`}
                  />
                  <IconButton size="small">
                    <Tooltip title="Скачать">
                      <DownloadIcon />
                    </Tooltip>
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Paper 
        sx={{ 
          width: 280, 
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          borderRadius: 0,
          display: { xs: mobileOpen ? 'block' : 'none', sm: 'block' }
        }}
      >
        {drawer}
      </Paper>

      {!selectedThread ? (
        <>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
            }}
          >
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Search />
                <TextField
                  fullWidth
                  placeholder="Поиск писем..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                  }}
                />
                <IconButton>
                  <Refresh />
                </IconButton>
              </Box>
            </Paper>

            <List>
              {filteredThreads.map((thread) => (
                <Paper 
                  key={thread.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1, 
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    borderLeft: thread.priority === 'high' ? '4px solid #ff4444' : '4px solid transparent',
                    opacity: thread.isRead ? 0.8 : 1
                  }}
                  onClick={() => handleThreadClick(thread)}
                >
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      {!thread.isRead && (
                        <Badge variant="dot" color="primary">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1976d2' }} />
                        </Badge>
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ fontWeight: thread.isRead ? 'normal' : 'bold' }}
                          >
                            {thread.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(thread.lastActivity).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              maxWidth: '70%'
                            }}
                          >
                            {thread.preview}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {thread.hasAttachments && <AttachFile fontSize="small" color="action" />}
                            <Chip 
                              label={thread.participants[0].split('@')[0]} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          </Box>
        </>
      ) : (
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: { sm: `calc(100% - ${280}px)` },
          }}
        >
          <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton onClick={handleBackToList}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {selectedThread.subject}
              </Typography>
              <IconButton>
                <ReplyIcon />
              </IconButton>
              <IconButton>
                <ReplyAllIcon />
              </IconButton>
              <IconButton>
                <ForwardIcon />
              </IconButton>
              <IconButton>
                <MoreVert />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              {selectedThread.participants.map((participant, index) => (
                <Chip
                  key={index}
                  label={participant}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {new Date(selectedThread.lastActivity).toLocaleString('ru-RU')}
            </Typography>
          </Paper>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {mailContent.mails.map((mail, index) => mailItem(mail, index))}
          </Box>

          <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="outlined" startIcon={<AttachFile />}>
                Прикрепить файл
              </Button>
              <Button variant="outlined" startIcon={<SendIcon />}>
                Ответить
              </Button>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Напишите ваш ответ..."
              variant="outlined"
            />
          </Paper>
        </Box>
      )}

      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setMobileOpen(true)}
          sx={{ display: { md: 'none' }, position: 'absolute', top: 10, left: 10 }}
        >
          <Menu />
        </IconButton>
      )}
    </Box>
  );
};

// Icons needed for this component
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
  </svg>
);

const ReplyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
  </svg>
);

const ReplyAllIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 8V5l-7 7 7 7v-3l-4-4 4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
  </svg>
);

const ForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8v5l4.28 2.54-.93 1.56L20 14v-4l-6-4-1.65 1.1-1.35-1.1L12 8z"/>
  </svg>
);

export const MailPage = App;
