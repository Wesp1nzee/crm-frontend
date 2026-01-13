import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Close,
  Send,
  AttachFile,
  Save,
} from '@mui/icons-material';
import { useSendMail } from '../../shared/hooks/useMail';
import { FileUpload } from '../../shared/ui/FileUpload';
import type { MailDraft, MailAttachment } from '../../entities/mail/types';

interface MailComposerProps {
  open: boolean;
  onClose: () => void;
  replyTo?: string;
  draft?: MailDraft;
}

export function MailComposer({ open, onClose, replyTo, draft }: MailComposerProps) {
  const [formData, setFormData] = useState<MailDraft>({
    to: draft?.to || [],
    cc: draft?.cc || [],
    bcc: draft?.bcc || [],
    subject: draft?.subject || '',
    body: draft?.body || '',
    attachments: draft?.attachments || [],
  });
  
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  
  const sendMail = useSendMail();

  const handleSend = async () => {
    await sendMail.mutateAsync(formData);
    onClose();
  };

  const handleFileUpload = async (files: File[]) => {
    const newAttachments: MailAttachment[] = files.map(file => ({
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...newAttachments]
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {replyTo ? 'Ответить' : 'Новое письмо'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Recipients */}
          <TextField
            label="Кому"
            fullWidth
            value={formData.to.join(', ')}
            onChange={(e) => setFormData({ ...formData, to: e.target.value.split(', ') })}
          />

          {/* CC/BCC */}
          <Box display="flex" gap={1}>
            <Button size="small" onClick={() => setShowCc(!showCc)}>
              CC
            </Button>
            <Button size="small" onClick={() => setShowBcc(!showBcc)}>
              BCC
            </Button>
          </Box>

          {showCc && (
            <TextField
              label="Копия"
              fullWidth
              value={formData.cc?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value.split(', ') })}
            />
          )}

          {showBcc && (
            <TextField
              label="Скрытая копия"
              fullWidth
              value={formData.bcc?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value.split(', ') })}
            />
          )}

          {/* Subject */}
          <TextField
            label="Тема"
            fullWidth
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />

          {/* Body */}
          <TextField
            label="Сообщение"
            multiline
            rows={12}
            fullWidth
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          />

          {/* Attachments */}
          {formData.attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Вложения
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {formData.attachments.map((attachment) => (
                  <Chip
                    key={attachment.id}
                    label={`${attachment.name} (${Math.round(attachment.size / 1024)}KB)`}
                    onDelete={() => {
                      setFormData({
                        ...formData,
                        attachments: formData.attachments.filter(a => a.id !== attachment.id)
                      });
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* File Upload */}
          <FileUpload onUpload={handleFileUpload} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Box display="flex" gap={1} width="100%" justifyContent="space-between">
          <Button startIcon={<AttachFile />}>
            Прикрепить
          </Button>
          
          <Box display="flex" gap={1}>
            <Button startIcon={<Save />}>
              Сохранить
            </Button>
            <Button onClick={onClose}>
              Отмена
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={handleSend}
              disabled={sendMail.isPending}
            >
              Отправить
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
}