import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Gavel,
  Person,
  Schedule,
  AttachMoney,
  Description,
  Visibility,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useCase, useClient } from '../../shared/hooks/useCases';
import { useCollaborationStatus } from '../../shared/hooks/useMail';
import type { MailThread } from '../../entities/mail/types';

interface ContextualSidebarProps {
  thread: MailThread;
}

export function ContextualSidebar({ thread }: ContextualSidebarProps) {
  const { data: relatedCase } = useCase(thread.relatedCaseId || '');
  const { data: relatedClient } = useClient(thread.relatedClientId || '');
  const { data: collaborationStatus = [] } = useCollaborationStatus(thread.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'in_progress': return 'primary';
      case 'done': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const isOverdue = relatedCase && dayjs(relatedCase.deadline).isBefore(dayjs(), 'day');

  return (
    <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', p: 2, overflow: 'auto' }}>
      {/* Collaboration Status */}
      {collaborationStatus.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility fontSize="small" />
            Сейчас просматривают
          </Typography>
          {collaborationStatus.map((status) => (
            <Box key={status.userId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {status.userName.charAt(0)}
              </Avatar>
              <Typography variant="body2">
                {status.userName} {status.action === 'reading' ? 'читает' : 'отвечает'}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Related Case */}
      {relatedCase && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Gavel fontSize="small" />
            Связанное дело
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {relatedCase.caseNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {relatedCase.objectAddress}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                size="small" 
                label={relatedCase.status} 
                color={getStatusColor(relatedCase.status)}
              />
              {isOverdue && (
                <Chip size="small" label="Просрочено" color="error" />
              )}
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Срок выполнения
              </Typography>
              <Typography variant="body2" color={isOverdue ? 'error.main' : 'inherit'}>
                {dayjs(relatedCase.deadline).format('DD.MM.YYYY')}
              </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Стоимость
              </Typography>
              <Typography variant="body2">
                {relatedCase.cost.toLocaleString()} ₽
              </Typography>
            </Box>

            {/* Progress */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Прогресс
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={relatedCase.status === 'done' ? 100 : 60} 
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Button variant="outlined" size="small" fullWidth>
            Открыть дело
          </Button>
        </Paper>
      )}

      {/* Related Client */}
      {relatedClient && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" />
            Клиент
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            {relatedClient.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {relatedClient.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {relatedClient.phone}
          </Typography>

          <Button variant="outlined" size="small" fullWidth>
            Профиль клиента
          </Button>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Быстрые действия
        </Typography>
        
        <List dense>
          <ListItem component="div" onClick={() => {}} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Создать задачу" />
          </ListItem>
          <ListItem component="div" onClick={() => {}} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Назначить встречу" />
          </ListItem>
          <ListItem component="div" onClick={() => {}} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Сформировать счет" />
          </ListItem>
          <ListItem component="div" onClick={() => {}} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Прикрепить документ" />
          </ListItem>
        </List>
      </Paper>

      {/* Recent Documents */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description fontSize="small" />
          Последние документы
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Договор на экспертизу"
              secondary="2 дня назад"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Фото объекта"
              secondary="5 дней назад"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}