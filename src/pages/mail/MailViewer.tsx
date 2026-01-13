import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Avatar,
  Paper,
  Collapse,
} from '@mui/material';
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Delete,
  Star,
  StarBorder,
  ExpandMore,
  ExpandLess,
  AttachFile,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { MailThread, Mail } from '../../entities/mail/types';

interface MailViewerProps {
  thread: MailThread;
}

export function MailViewer({ thread }: MailViewerProps) {
  const [expandedMails, setExpandedMails] = useState<Set<string>>(new Set([thread.mails[thread.mails.length - 1]?.id]));

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
      <Paper key={mail.id} variant="outlined" sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            p: 2, 
            cursor: 'pointer',
            bgcolor: isExpanded ? 'action.selected' : 'transparent'
          }}
          onClick={() => toggleMailExpansion(mail.id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {mail.from.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {mail.from}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(mail.receivedAt).format('DD.MM.YYYY HH:mm')}
              </Typography>
            </Box>

            {mail.attachments.length > 0 && (
              <AttachFile fontSize="small" color="action" />
            )}
            
            <IconButton size="small">
              {mail.isStarred ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
            
            <IconButton size="small">
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={isExpanded}>
          <Divider />
          <Box sx={{ p: 2 }}>
            {/* Mail Body */}
            <Box 
              sx={{ mb: 2 }}
              dangerouslySetInnerHTML={{ __html: mail.htmlBody || mail.body.replace(/\n/g, '<br>') }}
            />

            {/* Attachments */}
            {mail.attachments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Вложения ({mail.attachments.length})
                </Typography>
                {mail.attachments.map((attachment) => (
                  <Button
                    key={attachment.id}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  >
                    {attachment.name} ({Math.round(attachment.size / 1024)}KB)
                  </Button>
                ))}
              </Box>
            )}

            {/* Action Buttons */}
            {isLast && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button startIcon={<Reply />} size="small">
                  Ответить
                </Button>
                <Button startIcon={<ReplyAll />} size="small">
                  Ответить всем
                </Button>
                <Button startIcon={<Forward />} size="small">
                  Переслать
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {thread.subject}
          </Typography>
          
          <IconButton>
            <Archive />
          </IconButton>
          <IconButton color="error">
            <Delete />
          </IconButton>
        </Box>

        {/* Thread Info */}
        <Typography variant="body2" color="text.secondary">
          {thread.mails.length} сообщений, {thread.participants.length} участников
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Mails */}
      {thread.mails.map((mail, index) => 
        renderMail(mail, index === thread.mails.length - 1)
      )}
    </Box>
  );
}