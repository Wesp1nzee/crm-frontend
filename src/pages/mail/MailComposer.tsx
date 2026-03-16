import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import {
  AttachFile,
  Close,
  DeleteOutline,
  FormatAlignCenter,
  FormatAlignJustify,
  FormatAlignLeft,
  FormatBold,
  FormatClear,
  FormatIndentDecrease,
  FormatIndentIncrease,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatStrikethrough,
  FormatUnderlined,
  HorizontalRule,
  Link,
  Send,
} from "@mui/icons-material";
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

interface EditorCommandState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  unorderedList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignJustify: boolean;
  blockType: string;
  fontName: string;
  fontSize: string;
}

const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const LARGE_ATTACHMENT_HINT_MB = 25;
const DEFAULT_FONT = "Arial";
const DEFAULT_FONT_SIZE = "3";

const FONT_OPTIONS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Tahoma"];
const FONT_SIZE_OPTIONS = [
  { value: "1", label: "8px" },
  { value: "2", label: "10px" },
  { value: "3", label: "12px" },
  { value: "4", label: "14px" },
  { value: "5", label: "18px" },
  { value: "6", label: "24px" },
  { value: "7", label: "32px" },
];

const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;

const parseRecipientsText = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const normalizeFontName = (value: string) => {
  const cleaned = value.replace(/['"]/g, "").toLowerCase();

  const option = FONT_OPTIONS.find((font) => cleaned.includes(font.toLowerCase()));
  return option ?? DEFAULT_FONT;
};

const getPlainTextFromHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? "").trim();
};

const convertPlainTextToHtml = (text: string) => {
  if (!text.trim()) {
    return "";
  }

  if (typeof document === "undefined") {
    return text
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  const container = document.createElement("div");
  text.split("\n").forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    container.appendChild(paragraph);
  });

  return container.innerHTML;
};

const getBlockTypeLabel = (rawValue: string) => {
  const value = rawValue.toLowerCase().replace(/[<>]/g, "");

  if (value.includes("h1")) return "h1";
  if (value.includes("h2")) return "h2";
  if (value.includes("h3")) return "h3";
  if (value.includes("blockquote")) return "blockquote";

  return "p";
};

const getSafeQueryState = (command: string) => {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
};

const getSafeQueryValue = (command: string) => {
  try {
    return document.queryCommandValue(command);
  } catch {
    return "";
  }
};

const iconButtonSx = {
  width: 22,
  height: 22,
  p: 0,
};

const initialEditorState: EditorCommandState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  unorderedList: false,
  orderedList: false,
  blockquote: false,
  alignLeft: true,
  alignCenter: false,
  alignJustify: false,
  blockType: "p",
  fontName: DEFAULT_FONT,
  fontSize: DEFAULT_FONT_SIZE,
};

export function MailComposer({
  open,
  composeSessionId,
  onMinimize,
  onCloseDiscard,
  initialValues,
}: MailComposerProps) {
  const { data: user } = useAuth();
  const sendMail = useSendMail();

  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorCommandState>(initialEditorState);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#fff59d");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const syncEditorState = useCallback(() => {
    if (!editorRef.current || typeof document === "undefined") {
      return;
    }

    setEditorState({
      bold: getSafeQueryState("bold"),
      italic: getSafeQueryState("italic"),
      underline: getSafeQueryState("underline"),
      strikeThrough: getSafeQueryState("strikeThrough"),
      unorderedList: getSafeQueryState("insertUnorderedList"),
      orderedList: getSafeQueryState("insertOrderedList"),
      blockquote: getBlockTypeLabel(getSafeQueryValue("formatBlock")) === "blockquote",
      alignLeft: getSafeQueryState("justifyLeft"),
      alignCenter: getSafeQueryState("justifyCenter"),
      alignJustify: getSafeQueryState("justifyFull"),
      blockType: getBlockTypeLabel(getSafeQueryValue("formatBlock")),
      fontName: normalizeFontName(String(getSafeQueryValue("fontName") || DEFAULT_FONT)),
      fontSize: String(getSafeQueryValue("fontSize") || DEFAULT_FONT_SIZE),
    });
  }, []);

  useEffect(() => {
    setTo(parseRecipientsText(initialValues?.to));
    setCc(parseRecipientsText(initialValues?.cc));
    setBcc(parseRecipientsText(initialValues?.bcc));
    setSubject(initialValues?.subject ?? "");
    setBodyHtml(convertPlainTextToHtml(initialValues?.body ?? ""));
    setAttachments([]);
    setFormError(null);
    setEditorState(initialEditorState);
  }, [composeSessionId, initialValues]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== bodyHtml) {
      editorRef.current.innerHTML = bodyHtml;
      syncEditorState();
    }
  }, [bodyHtml, syncEditorState]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handler = () => syncEditorState();
    document.addEventListener("selectionchange", handler);

    return () => document.removeEventListener("selectionchange", handler);
  }, [syncEditorState]);

  const totalAttachmentBytes = useMemo(
    () => attachments.reduce((total, file) => total + file.size, 0),
    [attachments],
  );

  const hasOversizedAttachments = totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES;

  const plainBody = useMemo(() => getPlainTextFromHtml(bodyHtml), [bodyHtml]);

  const canSend = useMemo(() => to.length > 0 && plainBody.length > 0, [to, plainBody]);

  const buildRecipients = (emails: string[], type: MailRecipientType) =>
    emails.map((email_address) => ({ email_address, recipient_type: type }));

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

  const executeCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value);
    setBodyHtml(editorRef.current.innerHTML);
    syncEditorState();
  };

  const handleCreateLink = () => {
    const url = window.prompt("Введите URL", "https://");
    if (!url) return;

    executeCommand("createLink", url);
  };

  const handleBlockTypeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;

    if (value === "p") {
      executeCommand("formatBlock", "<p>");
      return;
    }

    if (value === "blockquote") {
      executeCommand("formatBlock", "<blockquote>");
      return;
    }

    executeCommand("formatBlock", `<${value}>`);
  };

  const handleFontNameChange = (event: SelectChangeEvent) => {
    executeCommand("fontName", event.target.value);
  };

  const handleFontSizeChange = (event: SelectChangeEvent) => {
    executeCommand("fontSize", event.target.value);
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    executeCommand("styleWithCSS", "true");
    executeCommand("foreColor", color);
  };

  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
    executeCommand("styleWithCSS", "true");
    executeCommand("hiliteColor", color);
  };

  const handleSend = async () => {
    setFormError(null);

    const html = bodyHtml.trim();
    const text = getPlainTextFromHtml(html);

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
        body_text: text,
        body_html: html,
        html_body: html,
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

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={to}
            onChange={(_, value) => setTo(value.map((item) => item.trim()).filter(Boolean))}
            renderInput={(params) => <TextField {...params} label="Кому" placeholder="Добавьте получателя" required fullWidth />}
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={cc}
            onChange={(_, value) => setCc(value.map((item) => item.trim()).filter(Boolean))}
            renderInput={(params) => <TextField {...params} label="Копия (CC)" placeholder="Добавьте копию" fullWidth />}
          />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={bcc}
            onChange={(_, value) => setBcc(value.map((item) => item.trim()).filter(Boolean))}
            renderInput={(params) => <TextField {...params} label="Скрытая копия (BCC)" placeholder="Добавьте скрытую копию" fullWidth />}
          />
          <TextField
            label="Тема"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            fullWidth
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Сообщение
            </Typography>

            <Stack
              direction="row"
              spacing={0.25}
              useFlexGap
              flexWrap="wrap"
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 0.75 }}
            >
              <Select size="small" value={editorState.blockType} onChange={handleBlockTypeChange} sx={{ minWidth: 110 }}>
                <MenuItem value="p">Параграф</MenuItem>
                <MenuItem value="h1">H1</MenuItem>
                <MenuItem value="h2">H2</MenuItem>
                <MenuItem value="h3">H3</MenuItem>
                <MenuItem value="blockquote">Цитата</MenuItem>
              </Select>

              <Select size="small" value={editorState.fontName} onChange={handleFontNameChange} sx={{ minWidth: 135 }}>
                {FONT_OPTIONS.map((font) => (
                  <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                    {font}
                  </MenuItem>
                ))}
              </Select>

              <Select size="small" value={editorState.fontSize} onChange={handleFontSizeChange} sx={{ minWidth: 80 }}>
                {FONT_SIZE_OPTIONS.map((size) => (
                  <MenuItem key={size.value} value={size.value}>
                    {size.label}
                  </MenuItem>
                ))}
              </Select>

              <Tooltip title="Полужирный">
                <IconButton color={editorState.bold ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("bold")}>
                  <FormatBold sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Курсив">
                <IconButton color={editorState.italic ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("italic")}>
                  <FormatItalic sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Подчеркивание">
                <IconButton color={editorState.underline ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("underline")}>
                  <FormatUnderlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Зачеркивание">
                <IconButton color={editorState.strikeThrough ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("strikeThrough")}>
                  <FormatStrikethrough sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Маркированный список">
                <IconButton color={editorState.unorderedList ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("insertUnorderedList")}>
                  <FormatListBulleted sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Нумерованный список">
                <IconButton color={editorState.orderedList ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("insertOrderedList")}>
                  <FormatListNumbered sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Цитата">
                <IconButton color={editorState.blockquote ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("formatBlock", "<blockquote>")}>
                  <FormatQuote sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Разделительная линия">
                <IconButton size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("insertHorizontalRule")}>
                  <HorizontalRule sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Box display="flex" alignItems="center" gap={0.5} sx={{ px: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Текст
                </Typography>
                <input
                  type="color"
                  value={textColor}
                  onChange={(event) => handleTextColorChange(event.target.value)}
                  style={{ width: 22, height: 22, border: "none", background: "transparent", padding: 0 }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={0.5} sx={{ px: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Маркер
                </Typography>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(event) => handleHighlightColorChange(event.target.value)}
                  style={{ width: 22, height: 22, border: "none", background: "transparent", padding: 0 }}
                />
              </Box>

              <Tooltip title="Выравнивание по левому краю">
                <IconButton color={editorState.alignLeft ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("justifyLeft")}>
                  <FormatAlignLeft sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Выравнивание по центру">
                <IconButton color={editorState.alignCenter ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("justifyCenter")}>
                  <FormatAlignCenter sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Выравнивание по ширине">
                <IconButton color={editorState.alignJustify ? "primary" : "default"} size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("justifyFull")}>
                  <FormatAlignJustify sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Увеличить отступ">
                <IconButton size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("indent")}>
                  <FormatIndentIncrease sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Уменьшить отступ">
                <IconButton size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("outdent")}>
                  <FormatIndentDecrease sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Вставить ссылку">
                <IconButton size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={handleCreateLink}>
                  <Link sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Очистить форматирование">
                <IconButton size="small" sx={iconButtonSx} onMouseDown={(event) => event.preventDefault()} onClick={() => executeCommand("removeFormat")}>
                  <FormatClear sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => {
                setBodyHtml(event.currentTarget.innerHTML);
                syncEditorState();
              }}
              onFocus={syncEditorState}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && editorState.blockquote) {
                  event.preventDefault();
                  executeCommand("formatBlock", "<p>");
                }
              }}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                minHeight: 240,
                p: 1.5,
                mt: 1,
                outline: "none",
                overflowWrap: "anywhere",
                lineHeight: 1.5,
                "&:focus": {
                  borderColor: "primary.main",
                  boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
                },
                "& h1, & h2, & h3": { marginTop: 1, marginBottom: 1 },
                "& blockquote": {
                  borderLeft: "3px solid",
                  borderColor: "divider",
                  pl: 1,
                  ml: 0,
                  color: "text.secondary",
                },
                "& ul, & ol": {
                  paddingInlineStart: "24px",
                  margin: "8px 0",
                },
                "& ul": { listStyleType: "disc" },
                "& ol": { listStyleType: "decimal" },
                "& li": { display: "list-item" },
              }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Enter в цитате завершает цитирование и переводит в обычный абзац. Shift + Enter — перенос строки внутри текущего блока.
            </Typography>
          </Box>

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
