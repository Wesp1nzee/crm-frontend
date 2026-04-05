import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  FormatStrikethrough,
  FormatUnderlined,
  HorizontalRule,
  Link,
  Send,
} from "@mui/icons-material";
import { useAuth } from "../../shared/hooks/useAuth";
import { useSendMail, useMailContactsAutocomplete } from "../../shared/hooks/useMail";
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
  if (!text.trim()) return "";
  if (typeof document === "undefined") {
    return text.split("\n").map((line) => `<p>${line}</p>`).join("");
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
  return "p";
};

const getSafeQueryState = (command: string) => {
  try { return document.queryCommandState(command); } catch { return false; }
};

const getSafeQueryValue = (command: string) => {
  try { return document.queryCommandValue(command); } catch { return ""; }
};

// ─── Стили ────────────────────────────────────────────────────────────────────

const toolbarSelectSx = {
  height: 26,
  "& .MuiSelect-select": {
    py: 0,
    px: 0.75,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "divider",
  },
};

const toolbarBtnSx = {
  width: 26,
  height: 26,
  p: 0,
  borderRadius: 0.75,
  "& svg": { fontSize: 15 },
};

const initialEditorState: EditorCommandState = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  unorderedList: false,
  orderedList: false,
  alignLeft: true,
  alignCenter: false,
  alignJustify: false,
  blockType: "p",
  fontName: DEFAULT_FONT,
  fontSize: DEFAULT_FONT_SIZE,
};

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

/** Кнопка тулбара с подсветкой активного состояния */
function ToolbarBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={title} enterDelay={600}>
      <IconButton
        size="small"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        sx={{
          ...toolbarBtnSx,
          color: active ? "primary.main" : "text.secondary",
          bgcolor: active ? "primary.50" : "transparent",
          "&:hover": {
            bgcolor: active ? "primary.100" : "action.hover",
          },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

/** Вертикальный разделитель между группами тулбара */
function ToolbarDivider() {
  return (
    <Divider
      orientation="vertical"
      flexItem
      sx={{ mx: 0.5, my: 0.25, borderColor: "divider" }}
    />
  );
}

/** Autocomplete для получателей с авто-созданием чипа при уходе фокуса */
function RecipientAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (emails: string[]) => void;
  required?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<number | null>(null);

  // Debounced search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (inputValue.trim().length === 0) {
      setSearchQuery("");
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(inputValue.trim());
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  const { data: autocompleteData } = useMailContactsAutocomplete(searchQuery, searchQuery.length > 0);

  // Filter out already selected emails
  const options = useMemo(() => {
    if (!autocompleteData?.items) return [];
    return autocompleteData.items.filter(
      (item) => !value.includes(item.email)
    );
  }, [autocompleteData, value]);

  // Фиксирует текущий inputValue как чип
  const commitInput = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputValue("");
      setSearchQuery("");
    },
    [value, onChange],
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      open={options.length > 0}
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.email
      }
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newValue, reason) => {
        // При выборе из дропдауна reason === "reset" — не перезаписываем вручную
        if (reason !== "reset") setInputValue(newValue);
      }}
      onChange={(_, newValue) => {
        onChange(newValue.map((item) => (typeof item === "string" ? item : item.email)));
        setInputValue("");
        setSearchQuery("");
      }}
      // ↓ Главное исправление: фиксируем чип при уходе фокуса
      onBlur={() => commitInput(inputValue)}
      renderOption={(props, option) => (
        <li {...props} key={option.email}>
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <Typography variant="body2" sx={{ fontSize: 14 }}>
              {option.email}
            </Typography>
            {option.name && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                {option.name}
              </Typography>
            )}
          </Box>
        </li>
      )}
      renderTags={(tagValues, getTagProps) =>
        tagValues.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={`${option}-${index}`}
            label={String(option)}
            size="small"
            sx={{
              borderRadius: "999px",
              bgcolor: "primary.50",
              border: "1px solid",
              borderColor: "primary.200",
              fontSize: 12,
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            "& .MuiInputBase-root:before, & .MuiInputBase-root:after": {
              display: "none",
            },
          }}
        />
      )}
    />
  );
}

// ─── Основной компонент ───────────────────────────────────────────────────────

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const syncEditorState = useCallback(() => {
    if (!editorRef.current || typeof document === "undefined") return;
    setEditorState({
      bold: getSafeQueryState("bold"),
      italic: getSafeQueryState("italic"),
      underline: getSafeQueryState("underline"),
      strikeThrough: getSafeQueryState("strikeThrough"),
      unorderedList: getSafeQueryState("insertUnorderedList"),
      orderedList: getSafeQueryState("insertOrderedList"),
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
    if (typeof document === "undefined") return;
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
    if (!sendMail.isPending) onMinimize();
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    setFormError(null);
    setAttachments((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
      const next = [...prev];
      Array.from(files).forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existing.has(key)) { existing.add(key); next.push(file); }
      });
      return next;
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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

  const handleBlockTypeChange = (e: SelectChangeEvent) => {
    const v = e.target.value;
    executeCommand("formatBlock", v === "p" ? "<p>" : `<${v}>`);
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
      content: { body_text: text, body_html: html, html_body: html },
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
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Новое письмо</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
          {formError && <Alert severity="error" sx={{ py: 0.5 }}>{formError}</Alert>}

          {/* ── Получатели ── */}
          <RecipientAutocomplete
            label="Кому"
            placeholder="Введите email"
            value={to}
            onChange={setTo}
            required
          />
          <RecipientAutocomplete
            label="Копия (CC)"
            placeholder="Введите email"
            value={cc}
            onChange={setCc}
          />
          <RecipientAutocomplete
            label="Скрытая копия (BCC)"
            placeholder="Введите email"
            value={bcc}
            onChange={setBcc}
          />

          <TextField
            label="Тема"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            size="small"
          />

          {/* ── Редактор ── */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
              Сообщение
            </Typography>

            {/* Тулбар форматирования */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.25}
              useFlexGap
              flexWrap="wrap"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderBottom: "none",
                borderRadius: "6px 6px 0 0",
                bgcolor: "grey.50",
                p: 0.75,
                gap: 0.25,
              }}
            >
              {/* Группа 1: стиль блока и шрифты */}
              <Select
                size="small"
                value={editorState.blockType}
                onChange={handleBlockTypeChange}
                sx={{ ...toolbarSelectSx, width: 58 }}
              >
                <MenuItem value="p" sx={{ fontSize: 13 }}>P</MenuItem>
                <MenuItem value="h1" sx={{ fontSize: 13, fontWeight: 700 }}>H1</MenuItem>
                <MenuItem value="h2" sx={{ fontSize: 13, fontWeight: 700 }}>H2</MenuItem>
                <MenuItem value="h3" sx={{ fontSize: 13, fontWeight: 700 }}>H3</MenuItem>
              </Select>

              <Select
                size="small"
                value={editorState.fontName}
                onChange={(e) => executeCommand("fontName", e.target.value)}
                sx={{ ...toolbarSelectSx, width: 130 }}
              >
                {FONT_OPTIONS.map((font) => (
                  <MenuItem key={font} value={font} sx={{ fontFamily: font, fontSize: 13 }}>
                    {font}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={editorState.fontSize}
                onChange={(e) => executeCommand("fontSize", e.target.value)}
                sx={{ ...toolbarSelectSx, width: 68 }}
              >
                {FONT_SIZE_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value} sx={{ fontSize: 13 }}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>

              <ToolbarDivider />

              {/* Группа 2: начертание */}
              <ToolbarBtn title="Полужирный" active={editorState.bold} onClick={() => executeCommand("bold")}>
                <FormatBold />
              </ToolbarBtn>
              <ToolbarBtn title="Курсив" active={editorState.italic} onClick={() => executeCommand("italic")}>
                <FormatItalic />
              </ToolbarBtn>
              <ToolbarBtn title="Подчёркивание" active={editorState.underline} onClick={() => executeCommand("underline")}>
                <FormatUnderlined />
              </ToolbarBtn>
              <ToolbarBtn title="Зачёркивание" active={editorState.strikeThrough} onClick={() => executeCommand("strikeThrough")}>
                <FormatStrikethrough />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Группа 3: списки */}
              <ToolbarBtn title="Маркированный список" active={editorState.unorderedList} onClick={() => executeCommand("insertUnorderedList")}>
                <FormatListBulleted />
              </ToolbarBtn>
              <ToolbarBtn title="Нумерованный список" active={editorState.orderedList} onClick={() => executeCommand("insertOrderedList")}>
                <FormatListNumbered />
              </ToolbarBtn>
              <ToolbarBtn title="Увеличить отступ" onClick={() => executeCommand("indent")}>
                <FormatIndentIncrease />
              </ToolbarBtn>
              <ToolbarBtn title="Уменьшить отступ" onClick={() => executeCommand("outdent")}>
                <FormatIndentDecrease />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Группа 4: выравнивание */}
              <ToolbarBtn title="По левому краю" active={editorState.alignLeft} onClick={() => executeCommand("justifyLeft")}>
                <FormatAlignLeft />
              </ToolbarBtn>
              <ToolbarBtn title="По центру" active={editorState.alignCenter} onClick={() => executeCommand("justifyCenter")}>
                <FormatAlignCenter />
              </ToolbarBtn>
              <ToolbarBtn title="По ширине" active={editorState.alignJustify} onClick={() => executeCommand("justifyFull")}>
                <FormatAlignJustify />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Группа 5: вставка и очистка */}
              <ToolbarBtn title="Разделительная линия" onClick={() => executeCommand("insertHorizontalRule")}>
                <HorizontalRule />
              </ToolbarBtn>
              <ToolbarBtn title="Вставить ссылку" onClick={handleCreateLink}>
                <Link />
              </ToolbarBtn>
              <ToolbarBtn title="Очистить форматирование" onClick={() => executeCommand("removeFormat")}>
                <FormatClear />
              </ToolbarBtn>
            </Stack>

            {/* Поле ввода сообщения */}
            <Box
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => { setBodyHtml(e.currentTarget.innerHTML); syncEditorState(); }}
              onFocus={syncEditorState}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "0 0 6px 6px",
                minHeight: 220,
                p: 1.5,
                outline: "none",
                overflowWrap: "anywhere",
                lineHeight: 1.6,
                fontSize: 14,
                bgcolor: "background.paper",
                "&:focus": {
                  borderColor: "primary.main",
                  boxShadow: (t) => `0 0 0 1px ${t.palette.primary.main}`,
                },
                "& h1, & h2, & h3": { mt: 1, mb: 0.5 },
                "& ul, & ol": { paddingInlineStart: "24px", my: 1 },
                "& ul": { listStyleType: "disc" },
                "& ol": { listStyleType: "decimal" },
                "& li": { display: "list-item" },
              }}
            />
          </Box>

          {/* ── Вложения ── */}
          <Box>
            <Button
              startIcon={<AttachFile />}
              onClick={() => fileInputRef.current?.click()}
              variant="outlined"
              size="small"
            >
              Добавить вложения
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => { handleAddFiles(e.target.files); e.target.value = ""; }}
              style={{ display: "none" }}
            />

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
              При суммарном объёме файлов больше {LARGE_ATTACHMENT_HINT_MB} МБ вложения будут отправлены как ссылка для скачивания.
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
              📎 {attachments.length} файла(ов) · {formatMb(totalAttachmentBytes)}
            </Typography>

            {hasOversizedAttachments && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                Файлы больше 25 МБ будут отправлены как ссылка для скачивания.
              </Alert>
            )}

            {attachments.length > 0 && (
              <List dense sx={{ mt: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                {attachments.map((file, index) => (
                  <ListItem
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => handleRemoveAttachment(index)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={formatMb(file.size)}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={sendMail.isPending} color="inherit">
          Свернуть
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => void handleSend()}
          disabled={!canSend || sendMail.isPending || !user?.email}
          disableElevation
        >
          {sendMail.isPending ? "Отправка..." : "Отправить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}