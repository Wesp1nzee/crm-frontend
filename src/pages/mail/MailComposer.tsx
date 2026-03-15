import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { AttachFile, Close, DeleteOutline, Send } from "@mui/icons-material";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSendMail } from "../../shared/hooks/useMail";
import { notificationService } from "../../shared/services/notifications";
import type { MailRecipientType, MailSendPayload } from "../../entities/mail/types";

interface MailComposerProps {
  open: boolean;
  composeSessionId: number;
  onMinimize: () => void;
  onCloseDiscard: () => void;
  initialValues?: {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
  };
}

const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const LARGE_ATTACHMENT_HINT_MB = 25;

const splitEmails = (value: string) =>
  value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;

export function MailComposer({
  open,
  composeSessionId,
  onMinimize,
  onCloseDiscard,
  initialValues,
}: MailComposerProps) {
  const { data: user } = useAuth();
  const sendMail = useSendMail();

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTo(initialValues?.to ?? "");
    setCc(initialValues?.cc ?? "");
    setBcc(initialValues?.bcc ?? "");
    setSubject(initialValues?.subject ?? "");
    setBody(initialValues?.body ?? "");
    setAttachments([]);
    setFormError(null);
  }, [composeSessionId, initialValues]);

  const totalAttachmentBytes = useMemo(
    () => attachments.reduce((total, file) => total + file.size, 0),
    [attachments],
  );

  const hasOversizedAttachments = totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES;

  const canSend = useMemo(
    () => splitEmails(to).length > 0 && body.trim().length > 0,
    [to, body],
  );

  const buildRecipients = (emails: string, type: MailRecipientType) =>
    splitEmails(emails).map((email_address) => ({ email_address, recipient_type: type }));

  const handleClose = () => {
    if (!sendMail.isPending) {
      onMinimize();
    }
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    setFormError(null);

    setAttachments((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const next = [...prev];

      Array.from(files).forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existing.has(key)) {
          existing.add(key);
          next.push(file);
        }
      });

      return next;
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSend = async () => {
    setFormError(null);

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

    try {
      const result = await sendMail.mutateAsync({ payload, files: attachments });

      if (result.status === "error" || result.status === "failed") {
        const rejectedFilesText = result.rejected_files?.length
          ? ` Рекомендуется убрать: ${result.rejected_files.join(", ")}.`
          : "";
        setFormError(
          result.error ??
            `Письмо не отправлено.${result.error_code ? ` Код ошибки: ${result.error_code}.` : ""}${rejectedFilesText}`,
        );
        return;
      }

      if (hasOversizedAttachments) {
        notificationService.info(
          "Файлы прикреплены как ссылки — они слишком большие для вложений. Получатель увидит ссылку для скачивания прямо в письме.",
          7000,
        );
      }

      onCloseDiscard();
    } catch {
      setFormError("Не удалось отправить письмо. Проверьте данные и попробуйте снова.");
    }
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
          {formError && <Alert severity="error">{formError}</Alert>}

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

          <Box>
            <Button
              startIcon={<AttachFile />}
              onClick={() => fileInputRef.current?.click()}
              variant="outlined"
            >
              Добавить вложения
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(event) => {
                handleAddFiles(event.target.files);
                event.target.value = "";
              }}
              style={{ display: "none" }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              При суммарном объеме файлов больше {LARGE_ATTACHMENT_HINT_MB} МБ вложения будут отправлены как ссылка для скачивания.
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              📎 {attachments.length} файла(ов) · {formatMb(totalAttachmentBytes)}
            </Typography>

            {hasOversizedAttachments && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚠️ Файлы больше 25 МБ будут отправлены как ссылка для скачивания.
              </Alert>
            )}

            {attachments.length > 0 && (
              <List dense sx={{ mt: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                {attachments.map((file, index) => (
                  <ListItem
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveAttachment(index)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={file.name} secondary={formatMb(file.size)} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={sendMail.isPending}>
          Свернуть
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
