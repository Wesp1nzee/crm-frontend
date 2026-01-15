import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, Button, Divider, Avatar, Paper, Collapse
} from '@mui/material';
import {
  Reply, Forward, Archive, Delete, Star, StarBorder, ExpandMore, ExpandLess, AttachFile
} from '@mui/icons-material';
import dayjs from 'dayjs';
import DOMPurify from 'dompurify';
import type { MailThread, Mail } from '../../entities/mail/types';

interface SafeHtmlViewerProps {
  html: string;
}

function SafeHtmlViewer({ html }: SafeHtmlViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState('0px');

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 
      'img', 'div', 'span', 'table', 'tbody', 'tr', 'td', 'th', 'thead', 'h1', 'h2', 'h3'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'target', 'width', 'height'],
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data.type === 'setHeight' && event.data.id === html.substring(0, 10)) {
      setHeight(`${event.data.height}px`);
    }
  }, [html]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, sans-serif; 
            font-size: 14px; 
            line-height: 1.6; 
            margin: 0; 
            padding: 10px; 
            overflow: hidden; 
            word-wrap: break-word;
          }
          img { max-width: 100%; height: auto; }
          a { color: #1976d2; }
        </style>
      </head>
      <body>
        <div id="content">${sanitizedHtml}</div>
        <script>
          // Отправляем высоту контента родителю
          function sendHeight() {
            const height = document.documentElement.scrollHeight;
            window.parent.postMessage({ 
              type: 'setHeight', 
              height: height, 
              id: '${html.substring(0, 10)}' 
            }, '*');
          }
          window.onload = sendHeight;
          new ResizeObserver(sendHeight).observe(document.body);
        </script>
      </body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      title="Secure Mail Content"
      srcDoc={srcDoc}
      // sandbox: Ключевой элемент безопасности
      // allow-scripts нужен ТОЛЬКО для работы ResizeObserver внутри (безопасно, так как домен пустой)
      // Мы НЕ добавляем allow-same-origin, поэтому доступа к кукам CRM НЕТ
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      style={{
        width: '100%',
        height: height,
        border: 'none',
        transition: 'height 0.2s ease'
      }}
    />
  );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ---
interface MailViewerProps {
  thread: MailThread;
}

export function MailViewer({ thread }: MailViewerProps) {
  const [expandedMails, setExpandedMails] = useState<Set<string>>(
    new Set([thread.mails[thread.mails.length - 1]?.id])
  );

  const toggleMailExpansion = (mailId: string) => {
    const newExpanded = new Set(expandedMails);
    if (newExpanded.has(mailId)) {
      newExpanded.delete(mailId);
    } else {
      newExpanded.add(mailId);
    }
    setExpandedMails(newExpanded);
  };

  const renderMail = (mail: Mail, isLast: boolean) => {
    const isExpanded = expandedMails.has(mail.id);
    
    return (
      <Paper key={mail.id} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            bgcolor: isExpanded ? 'action.hover' : 'transparent',
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}
          onClick={() => toggleMailExpansion(mail.id)}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {mail.from.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">{mail.from}</Typography>
            <Typography variant="caption" color="text.secondary">
              {dayjs(mail.receivedAt).format('DD.MM.YYYY HH:mm')}
            </Typography>
          </Box>

          {mail.attachments.length > 0 && <AttachFile fontSize="small" color="action" />}
          
          <IconButton size="small">
            {mail.isStarred ? <Star color="warning" /> : <StarBorder />}
          </IconButton>
          
          <IconButton size="small">
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2 }}>
            {/* БЕЗОПАСНАЯ ОТРИСОВКА ТЕЛА ПИСЬМА */}
            <Box sx={{ mb: 3 }}>
              {mail.htmlBody ? (
                <SafeHtmlViewer html={mail.htmlBody} />
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', px: 1 }}>
                  {mail.body}
                </Typography>
              )}
            </Box>

            {/* Вложения */}
            {mail.attachments.length > 0 && (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 1 }}>
                  ВЛОЖЕНИЯ ({mail.attachments.length})
                </Typography>
                {mail.attachments.map((att) => (
                  <Button
                    key={att.id}
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFile />}
                    sx={{ mr: 1, mb: 1, textTransform: 'none' }}
                  >
                    {att.name} ({Math.round(att.size / 1024)}KB)
                  </Button>
                ))}
              </Box>
            )}

            {isLast && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button startIcon={<Reply />} variant="contained" size="small">Ответить</Button>
                <Button startIcon={<Forward />} variant="outlined" size="small">Переслать</Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>{thread.subject}</Typography>
          <Typography variant="caption" color="text.secondary">
            {thread.mails.length} сообщений в переписке
          </Typography>
        </Box>
        <Box>
          <IconButton><Archive /></IconButton>
          <IconButton color="error"><Delete /></IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {thread.mails.map((mail, index) => 
        renderMail(mail, index === thread.mails.length - 1)
      )}
    </Box>
  );
}