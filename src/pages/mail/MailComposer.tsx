import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSendMail } from "../../shared/hooks/useMail";
import type { MailRecipientType, MailSendPayload } from "../../entities/mail/types";

interface MailComposerProps {
  open: boolean;
  onClose: () => void;
}

const splitEmails = (value: string) =>
  value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

export function MailComposer({ open, onClose }: MailComposerProps) {
  const { data: user } = useAuth();
  const sendMail = useSendMail();

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const canSend = useMemo(() => splitEmails(to).length > 0 && body.trim().length > 0, [to, body]);

  const buildRecipients = (emails: string, type: MailRecipientType) =>
    splitEmails(emails).map((email_address) => ({ email_address, recipient_type: type }));

  const handleClose = () => {
    if (!sendMail.isPending) {
      onClose();
    }
  };

  const handleSend = async () => {
    const payload: MailSendPayload = {
      sender_email: user?.email || "",
      sender_name: user?.full_name,
      subject: subject.trim() || undefined,
      recipients: [
        ...buildRecipients(to, "to"),
        ...buildRecipients(cc, "cc"),
        ...buildRecipients(bcc, "bcc"),
      ],
      content: {
        body_text: body,
      },
    };

    await sendMail.mutateAsync(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Новое письмо</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Кому"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="user@example.com, user2@example.com"
            required
            fullWidth
          />
          <TextField
            label="Копия (CC)"
            value={cc}
            onChange={(event) => setCc(event.target.value)}
            placeholder="cc@example.com"
            fullWidth
          />
          <TextField
            label="Скрытая копия (BCC)"
            value={bcc}
            onChange={(event) => setBcc(event.target.value)}
            placeholder="bcc@example.com"
            fullWidth
          />
          <TextField
            label="Тема"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            fullWidth
          />
          <TextField
            label="Сообщение"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            multiline
            minRows={8}
            fullWidth
            required
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={sendMail.isPending}>
          Отмена
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => void handleSend()}
          disabled={!canSend || sendMail.isPending || !user?.email}
        >
          {sendMail.isPending ? "Отправка..." : "Отправить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
