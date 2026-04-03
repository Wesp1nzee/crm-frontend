import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  useTheme,
  CircularProgress,
  Chip,
  Divider,
  Slide,
  Grow,
} from "@mui/material";
import {
  Close,
  Save,
  Search,
  CheckCircle,
  Warning,
  Business,
  Person,
  LocationOn,
} from "@mui/icons-material";
import { useState } from "react";
import type { ClientType, ClientCreateRequest } from "../../entities/client/types";
import { useManualDadataLookup } from "../../shared/hooks/useDadataLookup";

interface ClientFormData {
  name: string;
  short_name: string;
  type: ClientType;
  inn: string;
  email: string;
  phone: string;
  legal_address: string;
  actual_address: string;
  notes: string;
  // Initial contact fields
  contact_name: string;
  contact_position: string;
  contact_email: string;
  contact_phone: string;
  contact_is_main: boolean;
  contact_type: "legal_representative" | "court_officer" | "individual";
}

interface ClientCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientCreateRequest) => Promise<void>;
  isLoading: boolean;
}

const TYPE_ICONS = {
  legal: "🏢",
  individual: "👤",
  court: "⚖️",
};

export function ClientCreateDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}: ClientCreateDialogProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    short_name: "",
    type: "legal",
    inn: "",
    email: "",
    phone: "",
    legal_address: "",
    actual_address: "",
    notes: "",
    contact_name: "",
    contact_position: "",
    contact_email: "",
    contact_phone: "",
    contact_is_main: true,
    contact_type: "legal_representative",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    lookup,
    data: companyData,
    isLoading: isLookupLoading,
    error: lookupError,
    reset,
  } = useManualDadataLookup();

  const handleInnLookup = () => {
    if (!formData.inn || !/^\d{10,12}$/.test(formData.inn)) {
      setErrors((prev) => ({
        ...prev,
        inn: "ИНН должен содержать 10 или 12 цифр",
      }));
      return;
    }

    setErrors((prev) => {
      const newErrs = { ...prev };
      delete newErrs.inn;
      return newErrs;
    });

    lookup(formData.inn);
  };

  const fillFormData = () => {
    if (!companyData) return;

    setFormData((prev) => ({
      ...prev,
      name: companyData.full_name || prev.name,
      short_name: companyData.short_name || prev.short_name,
      inn: companyData.inn || prev.inn,
      legal_address: companyData.address || prev.legal_address,
    }));
  };

  const handleTypeChange = (type: ClientType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      inn: type !== "legal" ? "" : prev.inn,
    }));
    if (type !== "legal") {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs.inn;
        return newErrs;
      });
      reset();
    }
  };

  const handleDialogClose = (_event: unknown, reason: string) => {
    // Закрываем только если клик на backdrop (reason = "backdropClick")
    // или Escape (reason = "escapeKeyDown") - данные сохраняем
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      onClose();
    }
    // Если клик на крестик - не закрываем (он обрабатывается отдельно)
  };

  const handleCancelButtonClick = () => {
    // Сбрасываем данные DaData при отмене
    reset();
    onClose();
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }

    // Если меняем тип клиента и это не юрлицо, удаляем ошибку ИНН
    if (field === "type" && value !== "legal") {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs.inn;
        return newErrs;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Обязательное поле";
    }
    // Проверяем ИНН только для юридических лиц
    if (
      formData.type === "legal" &&
      (!formData.inn || !/^\d{10,12}$/.test(formData.inn))
    ) {
      newErrors.inn = "ИНН должен содержать 10 или 12 цифр";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const hasContact = formData.contact_name.trim().length > 0;

      const submitData = {
        name: formData.name,
        short_name: formData.short_name || undefined,
        type: formData.type,
        inn: formData.type === "legal" && formData.inn ? formData.inn : undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        legal_address: formData.legal_address || undefined,
        actual_address: formData.actual_address || undefined,
        notes: formData.notes || undefined,
        initial_contact: hasContact
          ? {
              name: formData.contact_name,
              position: formData.contact_position || undefined,
              email: formData.contact_email || undefined,
              phone: formData.contact_phone || undefined,
              is_main: formData.contact_is_main,
              contact_type: formData.contact_type,
            }
          : undefined,
      };

      await onSubmit(submitData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth={companyData && !lookupError ? "lg" : "md"}
      fullWidth
      scroll="paper"
      TransitionComponent={Slide}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: theme.shadows[8],
          overflow: "hidden",
          transition: theme.transitions.create("max-width", {
            duration: theme.transitions.duration.complex,
            easing: theme.transitions.easing.easeInOut,
          }),
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          color="text.primary"
          component="span"
        >
          Создать нового клиента
        </Typography>
        <IconButton onClick={() => { reset(); onClose(); }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", minHeight: "60vh" }}>
          {/* Left Panel - Form */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              minWidth: 0,
              overflowY: "auto",
              maxHeight: "65vh",
            }}
          >
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Основная информация
              </Typography>
              <TextField
                fullWidth
                label="Полное название *"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
                size="small"
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Краткое название"
                value={formData.short_name}
                onChange={(e) => handleChange("short_name", e.target.value)}
                size="small"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel id="client-type-label">Тип клиента *</InputLabel>
                <Select
                  labelId="client-type-label"
                  value={formData.type}
                  label="Тип клиента *"
                  onChange={(e) => handleTypeChange(e.target.value as ClientType)}
                  renderValue={(value) => (
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {TYPE_ICONS[value]}{" "}
                      {value === "legal"
                        ? "Юридическое лицо"
                        : value === "individual"
                          ? "Физическое лицо"
                          : "Суд"}
                    </Box>
                  )}
                >
                  <MenuItem value="legal">
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {TYPE_ICONS.legal} Юридическое лицо
                    </Box>
                  </MenuItem>
                  <MenuItem value="individual">
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {TYPE_ICONS.individual} Физическое лицо
                    </Box>
                  </MenuItem>
                  <MenuItem value="court">
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {TYPE_ICONS.court} Суд
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Контакты */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Контакты
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                size="small"
                placeholder="example@domain.ru"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Телефон"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                size="small"
                placeholder="+7 (999) 000-00-00"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
            </Box>

            {/* ИНН — только для ЮЛ */}
            {formData.type === "legal" && (
              <Box mb={3}>
                <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <TextField
                    fullWidth
                    label="ИНН *"
                    value={formData.inn}
                    onChange={(e) =>
                      handleChange("inn", e.target.value.replace(/\D/g, ""))
                    }
                    error={!!errors.inn}
                    helperText={
                      errors.inn ? (
                        <Typography variant="caption" color="error">
                          {errors.inn}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          10 или 12 цифр
                        </Typography>
                      )
                    }
                    size="small"
                    inputProps={{
                      maxLength: 12,
                      inputMode: "numeric",
                      style: { fontSize: "14px" },
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && formData.inn.length >= 10) {
                        e.preventDefault();
                        handleInnLookup();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleInnLookup}
                    disabled={
                      isLookupLoading ||
                      !formData.inn ||
                      !/^\d{10,12}$/.test(formData.inn)
                    }
                    startIcon={
                      isLookupLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Search />
                      )
                    }
                    endIcon={!isLookupLoading && companyData && <CheckCircle color="success" />}
                    sx={{
                      minWidth: 140,
                      height: 56,
                      textTransform: "none",
                      fontWeight: 500,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)",
                      },
                    }}
                  >
                    {isLookupLoading ? "Поиск..." : companyData ? "Найдено" : "Найти"}
                  </Button>
                </Box>

                {companyData && !lookupError && (
                  <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle color="success" sx={{ fontSize: 18 }} />
                    <Typography variant="body2" color="success.main" fontWeight={500}>
                      Организация найдена: {companyData.short_name || companyData.full_name}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Адреса */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Адреса
              </Typography>
              <TextField
                fullWidth
                label="Юридический адрес"
                multiline
                rows={2}
                value={formData.legal_address}
                onChange={(e) => handleChange("legal_address", e.target.value)}
                size="small"
                placeholder="Улица, дом, город"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Фактический адрес"
                multiline
                rows={2}
                value={formData.actual_address}
                onChange={(e) => handleChange("actual_address", e.target.value)}
                size="small"
                placeholder="Если отличается от юридического"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
            </Box>

            {/* Примечания */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Примечания
              </Typography>
              <TextField
                fullWidth
                label="Примечание к клиенту"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                size="small"
                placeholder="Дополнительная информация о клиенте"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
            </Box>

            {/* Начальный контакт */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Контактное лицо (необязательно)
              </Typography>
              <TextField
                fullWidth
                label="ФИО контакта"
                value={formData.contact_name}
                onChange={(e) => handleChange("contact_name", e.target.value)}
                size="small"
                placeholder="Иванов Иван Иванович"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Должность"
                value={formData.contact_position}
                onChange={(e) => handleChange("contact_position", e.target.value)}
                size="small"
                placeholder="Генеральный директор"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Email контакта"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
                size="small"
                placeholder="contact@company.ru"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <TextField
                fullWidth
                label="Телефон контакта"
                value={formData.contact_phone}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
                size="small"
                placeholder="+7 (999) 000-00-00"
                sx={{ mt: 2 }}
                inputProps={{ style: { fontSize: "14px" } }}
              />
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel id="contact-type-label">Тип контакта</InputLabel>
                <Select
                  labelId="contact-type-label"
                  value={formData.contact_type}
                  label="Тип контакта"
                  onChange={(e) => handleChange("contact_type", e.target.value)}
                >
                  <MenuItem value="legal_representative">Юридический представитель</MenuItem>
                  <MenuItem value="court_officer">Сотрудник суда</MenuItem>
                  <MenuItem value="individual">Физическое лицо</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  label="Основной контакт"
                  color={formData.contact_is_main ? "primary" : "default"}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_is_main: !prev.contact_is_main,
                    }))
                  }
                  clickable
                  size="small"
                />
              </Box>
            </Box>

            {Object.keys(errors).length > 0 && (
              <Alert severity="warning" sx={{ mt: 3, borderRadius: "8px" }}>
                Пожалуйста, исправьте ошибки в форме.
              </Alert>
            )}
          </Box>

          {/* Right Panel - Company Data */}
          {companyData && !lookupError && (
            <Grow in={!!companyData && !lookupError} timeout={300}>
              <Box
                sx={{
                  width: 450,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.grey[50],
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "65vh",
                  overflowY: "auto",
                  transition: (theme) =>
                    theme.transitions.create(["width", "opacity"], {
                      duration: 300,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: theme.palette.grey[100],
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: theme.palette.grey[300],
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: theme.palette.grey[400],
                  },
                }}
              >
                {/* Sticky Header */}
                <Box
                  sx={{
                    p: 3,
                    pb: 2,
                    backgroundColor: theme.palette.grey[50],
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Business color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Данные организации
                    </Typography>
                  </Box>
                </Box>

                {/* Scrollable Content */}
                <Box sx={{ p: 3, pt: 2, flexGrow: 1 }}>
                  {/* Status Badge */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      mb: 2,
                      backgroundColor:
                        companyData?.status === "ACTIVE"
                          ? theme.palette.success.light
                          : theme.palette.warning.light,
                      border: `1px solid ${
                        companyData?.status === "ACTIVE"
                          ? theme.palette.success.light
                          : theme.palette.warning.light
                      }`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {companyData?.status === "ACTIVE" ? (
                        <CheckCircle color="success" sx={{ fontSize: 18 }} />
                      ) : (
                        <Warning
                          color={
                            companyData?.status === "LIQUIDATING"
                              ? "warning"
                              : "error"
                          }
                          sx={{ fontSize: 18 }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={
                          companyData?.status === "ACTIVE"
                            ? "success.main"
                            : companyData?.status === "LIQUIDATING"
                              ? "warning.main"
                              : "error.main"
                        }
                      >
                        {companyData?.status === "ACTIVE"
                          ? "Действующая организация"
                          : companyData?.status === "LIQUIDATING"
                            ? "В процессе ликвидации"
                            : companyData?.status === "LIQUIDATED"
                              ? "Ликвидирована"
                              : "Банкрот"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Company Type Chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={companyData?.is_individual ? "ИП" : "Организация"}
                      icon={companyData?.is_individual ? <Person /> : <Business />}
                      color={companyData?.is_individual ? "info" : "primary"}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Full Name */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Полное наименование
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {companyData?.full_name}
                    </Typography>
                  </Box>

                  {/* Short Name */}
                  {companyData?.short_name && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Краткое наименование
                      </Typography>
                      <Typography variant="body2">
                        {companyData?.short_name}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Details */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {companyData?.address && (
                      <InfoField
                        label="Адрес"
                        value={companyData.address}
                        icon={<LocationOn sx={{ fontSize: 14 }} />}
                      />
                    )}
                  </Box>

                  {/* Warning Message */}
                  {companyData?.is_warning && companyData.warning_message && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {companyData.warning_message}
                    </Alert>
                  )}
                </Box>

                {/* Sticky Footer with Button */}
                <Box
                  sx={{
                    p: 3,
                    pt: 2,
                    backgroundColor: theme.palette.grey[50],
                    borderTop: `1px solid ${theme.palette.divider}`,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 1,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={fillFormData}
                    fullWidth
                    size="large"
                    startIcon={<Save />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 2,
                      boxShadow: "0 4px 12px rgba(66, 153, 225, 0.3)",
                      "&:hover": {
                        boxShadow: "0 6px 16px rgba(66, 153, 225, 0.4)",
                      },
                    }}
                  >
                    Заполнить форму данными
                  </Button>
                </Box>
              </Box>
            </Grow>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Button
          onClick={handleCancelButtonClick}
          variant="text"
          color="inherit"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Save />
            )
          }
          disabled={isLoading || !formData.name.trim()}
          sx={{
            minWidth: 120,
            fontWeight: 500,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { boxShadow: "0 4px 12px rgba(66, 153, 225, 0.2)" },
          }}
        >
          {isLoading ? "Создание..." : "Создать клиента"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Helper component for displaying info fields
interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoField({ label, value, icon }: InfoFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        {icon}
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
