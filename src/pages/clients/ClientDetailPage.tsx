import {
  AccessTime,
  Add,
  Business,
  Delete,
  Edit,
  Email,
  Person,
  Phone,
  Save,
  Cancel,
  WorkOutline,
  Note,
  Inbox,
  Send,
  Drafts,
  DeleteSweep,
  ArrowForwardIos,
  FiberManualRecord,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  TextField,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  alpha,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import {
  useClient,
  useUpdateClient,
  useClientContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "../../shared/hooks/useClients";
import { useState } from "react";
import type {
  ClientFull,
  ClientUpdateRequest,
  ContactType,
} from "../../entities/client/types";
import { notificationService } from "../../shared/services/notifications";
import AddressSuggestInput from "../../shared/ui/AddressSuggestInput";

// ─── label maps ───────────────────────────────────────────────────────────────

const clientTypeLabel: Record<string, string> = {
  legal: "Юридическое лицо",
  individual: "Физическое лицо",
  court: "Суд",
};

const contactTypeLabel: Record<string, string> = {
  legal_representative: "Представитель",
  court_officer: "Сотрудник суда",
  individual: "Контактное лицо",
};

const emailFolderIcon: Record<string, typeof Email> = {
  inbox: Inbox,
  sent: Send,
  drafts: Drafts,
  spam: Email,
  trash: DeleteSweep,
};


const ACCENT = "#2563EB";        // rich blue
const ACCENT_SOFT = "#EFF6FF";   // blue-50
const ACCENT_MID = "#BFDBFE";    // blue-200
const SURFACE = "#FFFFFF";
const SURFACE_2 = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#64748B";
const TEXT_MUTED = "#94A3B8";

const card = {
  borderRadius: "14px",
  border: `1px solid ${BORDER}`,
  background: SURFACE,
  boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  transition: "box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(15,23,42,0.09)",
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatClientEmail(email?: string | null) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const bad = ["false@", "test@", "example@", "no-reply@"];
  if (bad.some((h) => normalized.includes(h))) return null;
  return email;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}


interface EditableFieldProps {
  field: string; value: string; displayValue?: string; label: string;
  editingField: string | null; editValues: Record<string, string>;
  onEdit: (f: string, v: string) => void; onSave: (f: string) => void; onCancel: () => void;
  multiline?: boolean; type?: string; required?: boolean; canEdit?: boolean;
  isAddress?: boolean;
}

function EditableField({
  field, value, displayValue, label, editingField, editValues,
  onEdit, onSave, onCancel, multiline, type = "text", required = false, canEdit = true,
  isAddress = false,
}: EditableFieldProps) {
  const isEditing = canEdit && editingField === field;
  const currentValue = isEditing ? (editValues[field] ?? value) : value;
  const rendered = displayValue ?? value;

  return (
    <Box>
      <Typography sx={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_MUTED, mb: "4px" }}>
        {label}{required ? " *" : ""}
      </Typography>
      {isEditing ? (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 1.5, borderRadius: "10px", background: ACCENT_SOFT, border: `1.5px solid ${ACCENT_MID}` }}>
          {isAddress ? (
            <Box sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "14px", background: SURFACE, "& fieldset": { borderColor: BORDER }, "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" } } }}>
              <AddressSuggestInput value={currentValue} onChange={(newValue) => onEdit(field, newValue)} label={label} size="small" />
            </Box>
          ) : (
            <TextField size="small" value={currentValue} autoFocus fullWidth onChange={(e) => onEdit(field, e.target.value)} multiline={multiline} rows={multiline ? 3 : 1} type={type} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "14px", background: SURFACE, "& fieldset": { borderColor: BORDER }, "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" } } }} />
          )}
          <Tooltip title="Сохранить">
            <IconButton size="small" onClick={() => onSave(field)} sx={{ width: 30, height: 30, borderRadius: "8px", background: "#ECFDF3", border: `1px solid #BBF7D0`, color: "#16A34A", mt: multiline ? 0.5 : 0, "&:hover": { background: "#BBF7D0" } }}>
              <Save sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Отменить">
            <IconButton size="small" onClick={onCancel} sx={{ width: 30, height: 30, borderRadius: "8px", background: "#FEF2F2", border: `1px solid #FECACA`, color: "#DC2626", mt: multiline ? 0.5 : 0, "&:hover": { background: "#FECACA" } }}>
              <Cancel sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box onClick={canEdit ? () => onEdit(field, value) : undefined} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1.25, borderRadius: "10px", background: SURFACE_2, border: `1px solid ${BORDER}`, minHeight: 44, cursor: canEdit ? "pointer" : "default", transition: "all 0.15s", ...(canEdit ? { "&:hover": { background: ACCENT_SOFT, borderColor: ACCENT_MID, boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.06)}` } } : {}) }}>
          <Typography sx={{ flex: 1, fontSize: "14px", fontWeight: 500, color: rendered ? TEXT_PRIMARY : TEXT_MUTED }}>{rendered || "—"}</Typography>
          {canEdit && <Edit sx={{ fontSize: 13, color: TEXT_MUTED }} />}
        </Box>
      )}
    </Box>
  );
}

function StatBadge({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: "10px",
        background: accent ? ACCENT_SOFT : SURFACE_2,
        border: `1px solid ${accent ? ACCENT_MID : BORDER}`,
        flex: 1,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "8px",
          background: accent ? ACCENT : SURFACE,
          border: accent ? "none" : `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent ? "#fff" : TEXT_SECONDARY,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: "11px", color: TEXT_MUTED, fontWeight: 600, letterSpacing: "0.04em" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "18px", fontWeight: 700, color: accent ? ACCENT : TEXT_PRIMARY, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: "15px", fontWeight: 700, color: TEXT_PRIMARY }}>
          {title}
        </Typography>
        {count !== undefined && (
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              borderRadius: "6px",
              background: ACCENT_SOFT,
              border: `1px solid ${ACCENT_MID}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 0.75,
            }}
          >
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: ACCENT }}>
              {count}
            </Typography>
          </Box>
        )}
      </Stack>
      {action}
    </Stack>
  );
}

// ─── ContactFormData ──────────────────────────────────────────────────────────

interface ContactFormData {
  name: string;
  position: string;
  email: string;
  phone: string;
  is_main: boolean;
  contact_type: ContactType;
}

// ─── ContactDialog ────────────────────────────────────────────────────────────

function ContactDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
  initialData,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  isLoading: boolean;
  initialData?: ContactFormData;
  mode: "create" | "edit";
}) {
  const [formData, setFormData] = useState<ContactFormData>(
    initialData ?? {
      name: "",
      position: "",
      email: "",
      phone: "",
      is_main: false,
      contact_type: "legal_representative",
    },
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      notificationService.error("Имя контакта обязательно");
      return;
    }
    await onSubmit(formData);
    onClose();
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "14px",
      "& fieldset": { borderColor: BORDER },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2.5,
          px: 3,
          fontSize: "16px",
          fontWeight: 700,
          color: TEXT_PRIMARY,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        {mode === "create" ? "Добавить контакт" : "Редактировать контакт"}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 2.5 }}>
        <Stack spacing={2}>
          <TextField fullWidth label="ФИО *" value={formData.name} size="small"
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} sx={fieldSx} />
          <TextField fullWidth label="Должность" value={formData.position} size="small"
            onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))} sx={fieldSx} />
          <Stack direction="row" spacing={2}>
            <TextField fullWidth label="Email" type="email" value={formData.email} size="small"
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} sx={fieldSx} />
            <TextField fullWidth label="Телефон" value={formData.phone} size="small"
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} sx={fieldSx} />
          </Stack>
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Тип контакта</InputLabel>
            <Select
              value={formData.contact_type}
              label="Тип контакта"
              onChange={(e) => setFormData((p) => ({ ...p, contact_type: e.target.value as ContactType }))}
            >
              <MenuItem value="legal_representative">Юридический представитель</MenuItem>
              <MenuItem value="court_officer">Сотрудник суда</MenuItem>
              <MenuItem value="individual">Физическое лицо</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <Box
              onClick={() => setFormData((p) => ({ ...p, is_main: !p.is_main }))}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: "8px",
                border: `1.5px solid ${formData.is_main ? ACCENT : BORDER}`,
                background: formData.is_main ? ACCENT_SOFT : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                userSelect: "none",
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: formData.is_main ? ACCENT : BORDER,
                  transition: "all 0.15s",
                }}
              />
              <Typography sx={{ fontSize: "13px", fontWeight: 600, color: formData.is_main ? ACCENT : TEXT_SECONDARY }}>
                Основной контакт
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            color: TEXT_SECONDARY,
            border: `1px solid ${BORDER}`,
            px: 2.5,
            "&:hover": { background: SURFACE_2, border: `1px solid #CBD5E1` },
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            background: ACCENT,
            px: 2.5,
            boxShadow: "none",
            "&:hover": { background: "#1D4ED8", boxShadow: "none" },
          }}
        >
          {isLoading ? "Сохранение..." : mode === "create" ? "Добавить" : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── MainInfoFormData ─────────────────────────────────────────────────────────

interface MainInfoFormData {
  short_name: string;
  inn: string;
  email: string;
  phone: string;
  legal_address: string;
  actual_address: string;
}

// ─── MainInfoEdit ─────────────────────────────────────────────────────────────

function MainInfoEdit({
  client,
  onSave,
  onCancel,
  isSaving,
}: {
  client: ClientFull;
  onSave: (data: MainInfoFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<MainInfoFormData>({
    short_name: client.short_name ?? "",
    inn: client.inn ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    legal_address: client.legal_address ?? "",
    actual_address: client.actual_address ?? "",
  });

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "14px",
      "& fieldset": { borderColor: BORDER },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
  };

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Краткое название"
        value={formData.short_name}
        size="small"
        onChange={(e) => setFormData((p) => ({ ...p, short_name: e.target.value }))}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label="ИНН"
        value={formData.inn}
        size="small"
        onChange={(e) => setFormData((p) => ({ ...p, inn: e.target.value }))}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={formData.email}
        size="small"
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        sx={fieldSx}
      />
      <TextField
        fullWidth
        label="Телефон"
        value={formData.phone}
        size="small"
        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
        sx={fieldSx}
      />
      <AddressSuggestInput
        value={formData.legal_address}
        onChange={(value) => setFormData((p) => ({ ...p, legal_address: value }))}
        label="Юридический адрес"
        size="small"
        sx={fieldSx}
      />
      <AddressSuggestInput
        value={formData.actual_address}
        onChange={(value) => setFormData((p) => ({ ...p, actual_address: value }))}
        label="Фактический адрес"
        size="small"
        sx={fieldSx}
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button
          size="small"
          onClick={onCancel}
          disabled={isSaving}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            color: TEXT_SECONDARY,
            border: `1px solid ${BORDER}`,
            px: 2,
            "&:hover": { background: SURFACE_2, border: `1px solid #CBD5E1` },
          }}
        >
          Отмена
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaving}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            background: ACCENT,
            px: 2,
            boxShadow: "none",
            "&:hover": { background: "#1D4ED8", boxShadow: "none" },
          }}
        >
          {isSaving ? "Сохранение..." : "Сохранить"}
        </Button>
      </Stack>
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useClient(id!);
  const { data: contacts = [] } = useClientContacts(id!);
  const updateClient = useUpdateClient();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const [contactDialogMode, setContactDialogMode] = useState<"create" | "edit">("create");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingContactData, setEditingContactData] = useState<ContactFormData | undefined>();
  const createContact = useCreateContact(id!);
  const updateContact = useUpdateContact(id!);
  const deleteContact = useDeleteContact(id!);

  const [notesEditing, setNotesEditing] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const handleNotesSave = async () => {
    if (!id) return;
    await updateClient.mutateAsync({ id, data: { notes: notesValue || null } });
    setNotesEditing(false);
    notificationService.success("Примечание сохранено");
  };

  const handleNotesCancel = () => {
    setNotesValue(client?.notes ?? "");
    setNotesEditing(false);
  };

  const handleEditNotes = () => {
    setNotesValue(client?.notes ?? "");
    setNotesEditing(true);
  };

  const [mainInfoEditing, setMainInfoEditing] = useState(false);

  const handleMainInfoSave = async (data: MainInfoFormData) => {
    if (!id) return;
    const updateData: ClientUpdateRequest = {
      short_name: data.short_name || null,
      inn: data.inn || null,
      email: data.email || null,
      phone: data.phone || null,
      legal_address: data.legal_address || null,
      actual_address: data.actual_address || null,
    };
    await updateClient.mutateAsync({ id, data: updateData });
    setMainInfoEditing(false);
    notificationService.success("Основная информация обновлена");
  };

  const handleMainInfoCancel = () => {
    setMainInfoEditing(false);
  };

  const handleEditMainInfo = () => {
    setMainInfoEditing(true);
  };

  const handleAddContact = () => {
    setContactDialogMode("create");
    setEditingContactData(undefined);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: (typeof contacts)[0]) => {
    setContactDialogMode("edit");
    setEditingContactId(contact.id);
    setEditingContactData({
      name: contact.name,
      position: contact.position ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      is_main: contact.is_main,
      contact_type: contact.contact_type,
    });
    setContactDialogOpen(true);
  };

  const handleEditField = (field: string, value: string) => {
    setEditValues((p) => ({ ...p, [field]: value ?? "" }));
    setEditingField(field);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditValues((p) => ({ ...p, [field]: value }));
  };

  const handleSaveField = async (field: string) => {
    if (!id) return;
    try {
      const payload: Record<string, unknown> = {};
      // use edited value or fallback to current client value
      const val = editValues[field] ?? (client as any)[field] ?? null;
      payload[field] = val === "" ? null : val;

      await updateClient.mutateAsync({ id, data: payload as ClientUpdateRequest });
      setEditingField(null);
      setEditValues((p) => { const copy = { ...p }; delete copy[field]; return copy; });
      notificationService.success("Изменения сохранены");
    } catch (err) {
      notificationService.error(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleCancelField = (field?: string) => {
    if (field) {
      setEditValues((p) => { const copy = { ...p }; delete copy[field]; return copy; });
    }
    setEditingField(null);
  };

  const handleContactSubmit = async (data: ContactFormData) => {
    if (!id) return;
    try {
      if (contactDialogMode === "create") {
        await createContact.mutateAsync(data);
        notificationService.success("Контакт создан");
      } else if (editingContactId) {
        await updateContact.mutateAsync({ contactId: editingContactId, data });
        notificationService.success("Контакт обновлён");
      }
    } catch (err) {
      notificationService.error(err instanceof Error ? err.message : "Ошибка сохранения контакта");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!id) return;
    try {
      await deleteContact.mutateAsync(contactId);
      notificationService.success("Контакт удалён");
    } catch {
      notificationService.error("Ошибка удаления контакта");
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={32} sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (error || !client) {
    return (
      <Alert severity="error" sx={{ borderRadius: "12px" }}>
        Не удалось загрузить карточку клиента
      </Alert>
    );
  }

  const email = formatClientEmail(client.email);

  return (
    <Box sx={{ width: "100%", minWidth: 0, pb: 5 }}>
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          mb: 3,
          border: `1px solid ${BORDER}`,
          background: `linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 60%, #F8FAFC 100%)`,
          width: "100%",
        }}
      >
        {/* decorative blobs */}
        <Box sx={{
          position: "absolute", top: -40, right: -40,
          width: 220, height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(ACCENT, 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <Box sx={{
          position: "absolute", bottom: -30, left: "30%",
          width: 160, height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(ACCENT, 0.05)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Box sx={{ px: 3.5, py: 3, position: "relative" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" gap={2}>
              {/* Avatar block */}
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "18px",
                  flexShrink: 0,
                  boxShadow: `0 4px 14px ${alpha(ACCENT, 0.3)}`,
                  letterSpacing: "-0.5px",
                }}
              >
                {getInitials(client.name)}
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Typography sx={{ fontSize: "22px", fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: "-0.5px" }}>
                    {client.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: "8px",
                      background: ACCENT_SOFT,
                      border: `1px solid ${ACCENT_MID}`,
                    }}
                  >
                    {editingField === "type" ? (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <Select value={editValues["type"] ?? client.type} onChange={(e) => handleFieldChange("type", e.target.value as string)}>
                            <MenuItem value="legal">{clientTypeLabel["legal"]}</MenuItem>
                            <MenuItem value="individual">{clientTypeLabel["individual"]}</MenuItem>
                            <MenuItem value="court">{clientTypeLabel["court"]}</MenuItem>
                          </Select>
                        </FormControl>
                        <Tooltip title="Сохранить">
                          <IconButton size="small" onClick={() => handleSaveField("type")} sx={{ width: 30, height: 30 }}>
                            <Save sx={{ fontSize: 14, color: "#16A34A" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Отменить">
                          <IconButton size="small" onClick={() => handleCancelField("type")} sx={{ width: 30, height: 30 }}>
                            <Cancel sx={{ fontSize: 14, color: "#DC2626" }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <>
                        <Business sx={{ fontSize: 13, color: ACCENT }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: ACCENT, mr: 0.5 }}>
                          {clientTypeLabel[client.type] ?? client.type}
                        </Typography>
                        <Tooltip title="Редактировать тип клиента">
                          <IconButton
                            size="small"
                            onClick={() => handleEditField("type", client.type)}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "8px",
                              color: TEXT_SECONDARY,
                              border: `1px solid ${BORDER}`,
                              background: SURFACE_2,
                              "&:hover": { background: ACCENT_SOFT, borderColor: ACCENT_MID },
                            }}
                          >
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Stack>
                {client.inn && (
                  <Typography sx={{ fontSize: "13px", color: TEXT_SECONDARY, mt: 0.25 }}>
                    ИНН: <b style={{ color: TEXT_PRIMARY }}>{client.inn}</b>
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Quick stats inline */}
            <Stack direction="row" gap={1.5}>
              <StatBadge
                icon={<WorkOutline sx={{ fontSize: 16 }} />}
                label="Активных дел"
                value={client.active_cases}
                accent={Number(client.active_cases) > 0}
              />
              <StatBadge
                icon={<WorkOutline sx={{ fontSize: 16 }} />}
                label="Всего дел"
                value={client.total_cases}
              />
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* ── Body Grid ───────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Left Column */}
        <Box sx={{ width: { xs: "100%", md: "34%" }, flexShrink: 0 }}>
          <Stack spacing={2.5}>
            {/* ── Main Info Card ──────────────────── */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  title="Основная информация"
                  action={
                    !mainInfoEditing ? (
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={handleEditMainInfo}
                          sx={{
                            width: 28, height: 28,
                            border: `1px solid ${BORDER}`,
                            borderRadius: "8px",
                            color: TEXT_SECONDARY,
                            "&:hover": { background: SURFACE_2, borderColor: "#CBD5E1" },
                          }}
                        >
                          <Edit sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }
                />

                {mainInfoEditing ? (
                  <MainInfoEdit
                    client={client}
                    onSave={handleMainInfoSave}
                    onCancel={handleMainInfoCancel}
                    isSaving={updateClient.isPending}
                  />
                ) : (
                  <>
                    <Stack spacing={2.25}>
                      <EditableField
                        field="short_name"
                        value={client.short_name ?? ""}
                        label="Краткое название"
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("short_name")}
                      />
                      <EditableField
                        field="inn"
                        value={client.inn ?? ""}
                        label="ИНН"
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("inn")}
                      />
                      <EditableField
                        field="email"
                        value={client.email ?? ""}
                        displayValue={email ?? ""}
                        label="Email"
                        type="email"
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("email")}
                      />
                      <EditableField
                        field="phone"
                        value={client.phone ?? ""}
                        label="Телефон"
                        type="tel"
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("phone")}
                      />
                      <EditableField
                        field="legal_address"
                        value={client.legal_address ?? ""}
                        label="Юридический адрес"
                        isAddress
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("legal_address")}
                      />
                      <EditableField
                        field="actual_address"
                        value={client.actual_address ?? ""}
                        label="Фактический адрес"
                        isAddress
                        editingField={editingField}
                        editValues={editValues}
                        onEdit={handleEditField}
                        onSave={handleSaveField}
                        onCancel={() => handleCancelField("actual_address")}
                      />
                    </Stack>

                    <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${BORDER}` }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <AccessTime sx={{ fontSize: 13, color: TEXT_MUTED }} />
                          <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>
                            Создан: {new Date(client.created_at).toLocaleString("ru-RU")}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <AccessTime sx={{ fontSize: 13, color: TEXT_MUTED }} />
                          <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>
                            Обновлён: {new Date(client.updated_at).toLocaleString("ru-RU")}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── Notes Card ──────────────────────── */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  title="Примечания"
                  action={
                    !notesEditing ? (
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={handleEditNotes}
                          sx={{
                            width: 28, height: 28,
                            border: `1px solid ${BORDER}`,
                            borderRadius: "8px",
                            color: TEXT_SECONDARY,
                            "&:hover": { background: SURFACE_2, borderColor: "#CBD5E1" },
                          }}
                        >
                          <Edit sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    ) : null
                  }
                />

                {notesEditing ? (
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      size="small"
                      placeholder="Добавьте примечание к клиенту..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          fontSize: "14px",
                          "& fieldset": { borderColor: BORDER },
                          "&.Mui-focused fieldset": { borderColor: ACCENT, borderWidth: "1.5px" },
                        },
                      }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={handleNotesCancel}
                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, color: TEXT_SECONDARY }}
                      >
                        Отмена
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleNotesSave}
                        disabled={updateClient.isPending}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          background: ACCENT,
                          boxShadow: "none",
                          "&:hover": { background: "#1D4ED8", boxShadow: "none" },
                        }}
                      >
                        Сохранить
                      </Button>
                    </Stack>
                  </Stack>
                ) : client.notes ? (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      p: 1.5,
                      borderRadius: "10px",
                      background: SURFACE_2,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <Note sx={{ fontSize: 16, color: ACCENT, mt: "1px", flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "13.5px", color: TEXT_PRIMARY, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {client.notes}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    onClick={handleEditNotes}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      py: 3,
                      borderRadius: "10px",
                      border: `1.5px dashed ${BORDER}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: ACCENT_MID,
                        background: ACCENT_SOFT,
                      },
                    }}
                  >
                    <Note sx={{ fontSize: 22, color: TEXT_MUTED }} />
                    <Typography sx={{ fontSize: "13px", color: TEXT_MUTED, fontWeight: 500 }}>
                      Добавить примечание
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={2.5}>
            {/* ── Contacts Card ───────────────────── */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  title="Контакты"
                  count={contacts.length}
                  action={
                    <Button
                      size="small"
                      startIcon={<Add sx={{ fontSize: 15 }} />}
                      onClick={handleAddContact}
                      sx={{
                        borderRadius: "9px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "13px",
                        color: ACCENT,
                        border: `1px solid ${ACCENT_MID}`,
                        background: ACCENT_SOFT,
                        px: 1.5,
                        "&:hover": { background: "#DBEAFE" },
                      }}
                    >
                      Добавить
                    </Button>
                  }
                />

                {contacts.length === 0 ? (
                  <Box
                    onClick={handleAddContact}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      py: 4,
                      borderRadius: "10px",
                      border: `1.5px dashed ${BORDER}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: ACCENT_MID, background: ACCENT_SOFT },
                    }}
                  >
                    <Person sx={{ fontSize: 28, color: TEXT_MUTED }} />
                    <Typography sx={{ fontSize: "13px", color: TEXT_MUTED, fontWeight: 500 }}>
                      Контакты не добавлены. Нажмите для добавления.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.25}>
                    {contacts.map((contact) => (
                      <Box
                        key={contact.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          px: 2,
                          py: 1.75,
                          borderRadius: "12px",
                          border: `1px solid ${contact.is_main ? ACCENT_MID : BORDER}`,
                          background: contact.is_main ? ACCENT_SOFT : SURFACE_2,
                          transition: "box-shadow 0.15s",
                          "&:hover": { boxShadow: `0 2px 8px ${alpha(ACCENT, 0.1)}` },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: contact.is_main
                              ? `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`
                              : "#E2E8F0",
                            color: contact.is_main ? "#fff" : TEXT_SECONDARY,
                            fontSize: "13px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(contact.name)}
                        </Avatar>

                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography sx={{ fontSize: "14px", fontWeight: 700, color: TEXT_PRIMARY }}>
                              {contact.name}
                            </Typography>
                            {contact.is_main && (
                              <Box sx={{
                                px: 0.75, py: 0.25,
                                borderRadius: "5px",
                                background: ACCENT,
                                display: "inline-flex",
                              }}>
                                <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>
                                  ОСНОВНОЙ
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{
                              px: 0.75, py: 0.25,
                              borderRadius: "5px",
                              background: SURFACE,
                              border: `1px solid ${BORDER}`,
                            }}>
                              <Typography sx={{ fontSize: "10px", fontWeight: 600, color: TEXT_SECONDARY, letterSpacing: "0.04em" }}>
                                {contactTypeLabel[contact.contact_type] ?? contact.contact_type}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" flexWrap="wrap" gap={1.5} mt={0.5}>
                            {contact.position && (
                              <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.position}</Typography>
                            )}
                            {contact.email && (
                              <Stack direction="row" alignItems="center" gap={0.5}>
                                <Email sx={{ fontSize: 11, color: TEXT_MUTED }} />
                                <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.email}</Typography>
                              </Stack>
                            )}
                            {contact.phone && (
                              <Stack direction="row" alignItems="center" gap={0.5}>
                                <Phone sx={{ fontSize: 11, color: TEXT_MUTED }} />
                                <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>{contact.phone}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>

                        <Stack direction="row" gap={0.5} flexShrink={0}>
                          <Tooltip title="Редактировать">
                            <IconButton
                              size="small"
                              onClick={() => handleEditContact(contact)}
                              sx={{
                                width: 30, height: 30,
                                borderRadius: "8px",
                                border: `1px solid ${BORDER}`,
                                color: TEXT_SECONDARY,
                                "&:hover": { background: SURFACE, borderColor: "#CBD5E1" },
                              }}
                            >
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteContact(contact.id)}
                              disabled={deleteContact.isPending}
                              sx={{
                                width: 30, height: 30,
                                borderRadius: "8px",
                                border: `1px solid #FEE2E2`,
                                color: "#EF4444",
                                "&:hover": { background: "#FFF1F2", borderColor: "#FECACA" },
                              }}
                            >
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* ── Recent Emails Card ──────────────── */}
            <Card sx={card} elevation={0}>
              <CardContent sx={{ p: 2.5 }}>
                <SectionHeader
                  title="Последние письма"
                  count={client.recent_emails?.length ?? 0}
                />

                {!client.recent_emails || client.recent_emails.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      py: 4,
                      borderRadius: "10px",
                      border: `1.5px dashed ${BORDER}`,
                    }}
                  >
                    <Email sx={{ fontSize: 28, color: TEXT_MUTED }} />
                    <Typography sx={{ fontSize: "13px", color: TEXT_MUTED, fontWeight: 500 }}>
                      Писем пока нет
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {client.recent_emails.map((email) => {
                      const FolderIcon = emailFolderIcon[email.folder] ?? Email;
                      const isIncoming = email.message_type === "incoming";
                      return (
                        <Box
                          key={email.id}
                          onClick={() => navigate(`/crm/mail/inbox/${email.thread_id}`)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.75,
                            px: 2,
                            py: 1.5,
                            borderRadius: "12px",
                            border: `1px solid ${email.is_read ? BORDER : ACCENT_MID}`,
                            background: email.is_read ? SURFACE_2 : ACCENT_SOFT,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            "&:hover": {
                              boxShadow: `0 2px 10px ${alpha(ACCENT, 0.1)}`,
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          {/* folder icon */}
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "10px",
                              background: isIncoming
                                ? `linear-gradient(135deg, ${ACCENT} 0%, #3B82F6 100%)`
                                : "#E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isIncoming ? "#fff" : TEXT_SECONDARY,
                              flexShrink: 0,
                            }}
                          >
                            <FolderIcon sx={{ fontSize: 16 }} />
                          </Box>

                          {/* content */}
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                              {!email.is_read && (
                                <FiberManualRecord sx={{ fontSize: 8, color: ACCENT }} />
                              )}
                              <Typography
                                sx={{
                                  fontSize: "13.5px",
                                  fontWeight: email.is_read ? 500 : 700,
                                  color: TEXT_PRIMARY,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "340px",
                                }}
                              >
                                {email.subject || "(Без темы)"}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={1.5} mt={0.35} flexWrap="wrap">
                              <Typography sx={{ fontSize: "12px", color: TEXT_SECONDARY }}>
                                {email.sender_name || email.sender_email}
                              </Typography>
                              <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>·</Typography>
                              <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>
                                {email.sent_at
                                  ? new Date(email.sent_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                                  : "—"}
                              </Typography>
                              {email.case_number && (
                                <>
                                  <Typography sx={{ fontSize: "12px", color: TEXT_MUTED }}>·</Typography>
                                  <Typography sx={{ fontSize: "12px", color: ACCENT, fontWeight: 600 }}>
                                    Дело {email.case_number}
                                  </Typography>
                                </>
                              )}
                            </Stack>
                          </Box>

                          {/* badges */}
                          <Stack direction="row" alignItems="center" gap={1} flexShrink={0}>
                            {!email.is_read && (
                              <Box sx={{
                                px: 0.75, py: 0.25,
                                borderRadius: "5px",
                                background: ACCENT,
                              }}>
                                <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#fff" }}>
                                  НОВОЕ
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{
                              px: 0.75, py: 0.25,
                              borderRadius: "5px",
                              background: SURFACE,
                              border: `1px solid ${BORDER}`,
                            }}>
                              <Typography sx={{ fontSize: "10px", fontWeight: 600, color: TEXT_SECONDARY, letterSpacing: "0.04em" }}>
                                {isIncoming ? "Вх." : "Исх."}
                              </Typography>
                            </Box>
                            <ArrowForwardIos sx={{ fontSize: 11, color: TEXT_MUTED }} />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>

      {/* ── Contact Dialog ──────────────────────────────────────────── */}
      <ContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        onSubmit={handleContactSubmit}
        isLoading={createContact.isPending || updateContact.isPending}
        initialData={editingContactData}
        mode={contactDialogMode}
      />
    </Box>
  );
}