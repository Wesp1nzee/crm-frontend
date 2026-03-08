// src/pages/cases/CreateCaseDialog.tsx
import React, { useState, useCallback, memo, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  IconButton,
  Chip,
  Fade,
  InputAdornment,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  BusinessCenter as BusinessCenterIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import type { CaseStatus, CaseCreateRequest } from "../../entities/case/types";
import { useClientsSuggest } from "../../shared/hooks/useClientsSuggest";
import { useExpertsSuggest } from "../../shared/hooks/useExpertsSuggest";
import { useCreateClient } from "../../shared/hooks/useClients";
import type { ClientCreateRequest as ClientCreateRequestType } from "../../entities/client/types";
import { ClientCreateDialog } from "../clients/ClientCreateDialog";
import { notificationService } from "../../shared/services/notifications";

// ===== КОНСТАНТЫ (вынесены за пределы компонента) =====
const INPUT_HEIGHT = 54;

const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  archive: "Архив",
  in_work: "В работе",
  debt: "Долг",
  executed: "Выполнено",
  withdrawn: "Отозвано",
  cancelled: "Отменено",
  fssp: "ФССП",
};

const CASE_STATUS_COLORS: Record<
  CaseStatus,
  "default" | "primary" | "secondary" | "error" | "warning" | "success" | "info"
> = {
  archive: "default",
  in_work: "primary",
  debt: "warning",
  executed: "success",
  withdrawn: "secondary",
  cancelled: "error",
  fssp: "info",
};
const singleLineInputSx = {
  "& .MuiInputBase-root": {
    height: INPUT_HEIGHT,
    minHeight: INPUT_HEIGHT,
    boxSizing: "border-box",
    px: 1.5,
    width: "100%",
  },
  "& .MuiOutlinedInput-input": {
    py: 0,
    minHeight: INPUT_HEIGHT - 2,
    boxSizing: "border-box",
    width: "100%",
  },
} as const;

// ... остальные стили ...

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
export function createInitialFormData(): CaseCreateRequest {
  return {
    client_id: "",
    number: "",
    case_number: "",
    authority: "",
    case_type: "",
    object_type: "",
    object_address: "",
    judge_name: "",
    status: "in_work" as CaseStatus,
    start_date: dayjs().toISOString(),
    deadline: dayjs().add(30, "day").toISOString(),
    cost: 0,
    bank_transfer_amount: 0,
    cash_amount: 0,
    remaining_debt: 0,
    plaintiff: "",
    defendant: "",
    remarks: "",
    expert_ids: [],
  };
}

function normalizeCasePayload(formData: CaseCreateRequest) {
  return {
    client_id: formData.client_id.trim(),
    number: formData.number.trim(),
    case_number: formData.case_number.trim(),
    authority: formData.authority.trim(),
    case_type: formData.case_type.trim(),
    object_type: formData.object_type.trim(),
    object_address: formData.object_address.trim(),
    judge_name: formData.judge_name?.trim() || null,
    status: formData.status,
    start_date: formData.start_date,
    deadline: formData.deadline,
    cost: formData.cost.toFixed(2),
    bank_transfer_amount: formData.bank_transfer_amount.toFixed(2),
    cash_amount: formData.cash_amount.toFixed(2),
    remaining_debt: formData.remaining_debt.toFixed(2),
    plaintiff: formData.plaintiff?.trim() || null,
    defendant: formData.defendant?.trim() || null,
    remarks: formData.remarks?.trim() || null,
    expert_ids: formData.expert_ids?.length ? formData.expert_ids : [],
  };
}

// ===== МЕМОИЗИРОВАННЫЕ КОМПОНЕНТЫ =====
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

const SectionHeader = memo(({ icon, title, subtitle }: SectionHeaderProps) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, mt: 0.5 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "10px",
        bgcolor: "primary.main",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        color="text.primary"
        lineHeight={1.3}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
));

SectionHeader.displayName = "SectionHeader";

const FormSection = memo(({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      bgcolor: "grey.50",
      borderRadius: "12px",
      border: "1px solid",
      borderColor: "divider",
      p: 2.5,
      "&:first-of-type": { mt: 0 },
    }}
  >
    {children}
  </Box>
));

FormSection.displayName = "FormSection";

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  autoFocus?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  inputSx?: object;
}

const FormField = memo(
  ({
    label,
    value,
    onChange,
    error,
    required = false,
    type = "text",
    multiline = false,
    rows = 1,
    autoFocus = false,
    startAdornment,
    endAdornment,
    inputSx = singleLineInputSx,
  }: FormFieldProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    return (
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={handleChange}
        error={!!error}
        helperText={error}
        required={required}
        type={type}
        multiline={multiline}
        rows={rows}
        autoFocus={autoFocus}
        sx={inputSx}
        InputProps={{
          startAdornment: startAdornment ? (
            <InputAdornment position="start" sx={{ mr: 1 }}>
              {startAdornment}
            </InputAdornment>
          ) : undefined,
          endAdornment,
        }}
      />
    );
  },
);

FormField.displayName = "FormField";

// ✅ ИСПРАВЛЕННОЕ финансовое поле
interface FinancialFieldProps {
  field: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const FinancialField = memo(
  ({ field, label, value, onChange }: FinancialFieldProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    return (
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField
          fullWidth
          label={label}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          InputProps={{
            endAdornment: <InputAdornment position="end">₽</InputAdornment>,
            inputProps: {
              style: { textAlign: "right" },
            },
          }}
          sx={singleLineInputSx}
        />
      </Grid>
    );
  },
);

FinancialField.displayName = "FinancialField";

interface PartyFieldProps {
  field: "plaintiff" | "defendant";
  label: string;
  value: string;
  onChange: (field: "plaintiff" | "defendant", value: string) => void;
}

const PartyField = memo(
  ({ field, label, value, onChange }: PartyFieldProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(field, e.target.value);
      },
      [field, onChange],
    );

    return (
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label={label}
          value={value}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <PersonIcon sx={{ color: "text.disabled", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={singleLineInputSx}
        />
      </Grid>
    );
  },
);

PartyField.displayName = "PartyField";

// ===== ОСНОВНОЙ КОМПОНЕНТ =====
interface CreateCaseDialogProps {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: CaseCreateRequest) => Promise<void>;
}

export const CreateCaseDialog = memo(
  ({ open, isPending, onClose, onSubmit }: CreateCaseDialogProps) => {
    // ===== STATE =====
    const [formData, setFormData] = useState<CaseCreateRequest>(
      createInitialFormData(),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [clientInputValue, setClientInputValue] = useState("");
    const [expertInputValue, setExpertInputValue] = useState("");
    const [selectedClient, setSelectedClient] = useState<{
      id: string;
      name: string;
    } | null>(null);
    const [selectedExperts, setSelectedExperts] = useState<
      Array<{ id: string; name: string }>
    >([]);
    const [isExpertAutocompleteOpen, setIsExpertAutocompleteOpen] =
      useState(false);
    const expertInputRef = useRef<HTMLInputElement | null>(null);
    const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
    const [clientCreatedFromDialog, setClientCreatedFromDialog] =
      useState(false);

    // ✅ НОВОЕ: Отдельный state для финансовых полей (строки для редактирования)
    const [financialValues, setFinancialValues] = useState({
      cost: "0",
      bank_transfer_amount: "0",
      cash_amount: "0",
      remaining_debt: "0",
    });

    // ===== HOOKS =====
    const {
      suggestions,
      isLoading: isSuggestLoading,
      fetchSuggestions,
      clearSuggestions,
    } = useClientsSuggest();

    const {
      suggestions: expertSuggestions,
      isLoading: isExpertSuggestLoading,
      fetchSuggestions: fetchExpertSuggestions,
      clearSuggestions: clearExpertSuggestions,
    } = useExpertsSuggest();

    const createClient = useCreateClient();

    // ===== MEMOIZED VALUES =====
    const isFormValid = useMemo(
      () =>
        formData.client_id.trim() &&
        formData.number.trim() &&
        formData.case_number.trim() &&
        formData.authority.trim() &&
        formData.case_type.trim() &&
        formData.object_type.trim() &&
        formData.object_address.trim(),
      [
        formData.client_id,
        formData.number,
        formData.case_number,
        formData.authority,
        formData.case_type,
        formData.object_type,
        formData.object_address,
      ],
    );

    // ===== CALLBACKS =====
    const resetForm = useCallback(() => {
      const initial = createInitialFormData();
      setFormData(initial);
      setFinancialValues({
        cost: initial.cost.toString(),
        bank_transfer_amount: initial.bank_transfer_amount.toString(),
        cash_amount: initial.cash_amount.toString(),
        remaining_debt: initial.remaining_debt.toString(),
      });
      setErrors({});
      setClientInputValue("");
      setExpertInputValue("");
      setSelectedClient(null);
      setSelectedExperts([]);
      setIsExpertAutocompleteOpen(false);
      setClientCreatedFromDialog(false);
      clearSuggestions();
      clearExpertSuggestions();
    }, [clearSuggestions, clearExpertSuggestions]);

    const handleClose = useCallback(() => {
      resetForm();
      onClose();
    }, [resetForm, onClose]);

    const handleEntered = useCallback(() => {
      resetForm();
    }, [resetForm]);

    const clearError = useCallback((field: string) => {
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }, []);

    const handleFieldChange = useCallback(
      (field: keyof CaseCreateRequest, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
          clearError(field);
        }
      },
      [errors, clearError],
    );

    // ✅ ИСПРАВЛЕНО: Обработка финансовых полей
    const handleFinancialChange = useCallback(
      (
        field:
          | "cost"
          | "bank_transfer_amount"
          | "cash_amount"
          | "remaining_debt",
        value: string,
      ) => {
        // Разрешаем пустую строку и цифры с точкой
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
          setFinancialValues((prev) => ({ ...prev, [field]: value }));
          // Обновляем formData для отправки (пустая строка = 0)
          setFormData((prev) => ({
            ...prev,
            [field]: value === "" ? 0 : Number(value),
          }));
        }
      },
      [],
    );

    const handlePartyChange = useCallback(
      (field: "plaintiff" | "defendant", value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      },
      [],
    );

    const validateForm = useCallback((): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.client_id.trim()) newErrors.client_id = "Выберите клиента";
      if (!formData.number.trim()) newErrors.number = "Обязательное поле";
      if (!formData.case_number.trim())
        newErrors.case_number = "Обязательное поле";
      if (!formData.authority.trim()) newErrors.authority = "Обязательное поле";
      if (!formData.case_type.trim()) newErrors.case_type = "Обязательное поле";
      if (!formData.object_type.trim())
        newErrors.object_type = "Обязательное поле";
      if (!formData.object_address.trim())
        newErrors.object_address = "Обязательное поле";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) return;
      const normalizedData = normalizeCasePayload(formData);
      await onSubmit(normalizedData as CaseCreateRequest);
    }, [formData, validateForm, onSubmit]);

    const handleClientInputChange = useCallback(
      (_e: any, newInputValue: string, reason: string) => {
        setClientInputValue(newInputValue);
        if (reason === "clear") {
          clearSuggestions();
        } else if (reason === "input" && newInputValue.trim().length >= 2) {
          fetchSuggestions(newInputValue);
        }
      },
      [fetchSuggestions, clearSuggestions],
    );

    const handleClientChange = useCallback(
      (_e: any, value: any, reason: string) => {
        if (reason === "clear") {
          setFormData((prev) => ({ ...prev, client_id: "" }));
          setSelectedClient(null);
          setClientInputValue("");
          clearSuggestions();
          setClientCreatedFromDialog(false);
        } else if (value) {
          setFormData((prev) => ({ ...prev, client_id: value.id }));
          setSelectedClient(value);
          setClientInputValue(value.name);
          clearError("client_id");
          setClientCreatedFromDialog(false);
        }
      },
      [clearSuggestions, clearError],
    );

    const handleExpertInputChange = useCallback(
      (_e: any, newInputValue: string, reason: string) => {
        setExpertInputValue(newInputValue);
        if (reason === "clear") {
          clearExpertSuggestions();
        } else if (reason === "input" && newInputValue.trim().length >= 2) {
          fetchExpertSuggestions(newInputValue);
        }
        if (reason !== "reset") {
          setIsExpertAutocompleteOpen(true);
        }
      },
      [fetchExpertSuggestions, clearExpertSuggestions],
    );

    const handleExpertChange = useCallback(
      (_e: any, value: Array<{ id: string; name: string }>) => {
        const nextExperts = value ?? [];
        setFormData((prev) => ({
          ...prev,
          expert_ids: nextExperts.map((expert) => expert.id),
        }));
        setSelectedExperts(nextExperts);
      },
      [],
    );

    const handleRemoveExpertTag = useCallback((expertId: string) => {
      setSelectedExperts((prev) => {
        const nextExperts = prev.filter((expert) => expert.id !== expertId);
        setFormData((current) => ({
          ...current,
          expert_ids: nextExperts.map((expert) => expert.id),
        }));
        return nextExperts;
      });

      setIsExpertAutocompleteOpen(true);
      requestAnimationFrame(() => {
        expertInputRef.current?.focus();
      });
    }, []);

    const handleCreateClient = useCallback(
      async (clientData: ClientCreateRequestType) => {
        try {
          const newClient = await createClient.mutateAsync(clientData);
          setFormData((prev) => ({ ...prev, client_id: newClient.id }));
          setSelectedClient({ id: newClient.id, name: newClient.name });
          setClientInputValue(newClient.name);
          setClientCreatedFromDialog(true);
          clearError("client_id");
          setCreateClientDialogOpen(false);
          notificationService.success("Клиент успешно создан и выбран");
        } catch (error) {
          console.error("Ошибка создания клиента:", error);
          notificationService.error("Не удалось создать клиента");
        }
      },
      [createClient, clearError],
    );

    // ===== RENDER =====
    return (
      <>
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="lg"
          fullWidth
          TransitionComponent={Fade}
          transitionDuration={240}
          TransitionProps={{ onEntered: handleEntered }}
          PaperProps={{
            sx: {
              borderRadius: "16px",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18)",
              overflow: "hidden",
              maxHeight: "90vh",
            },
          }}
        >
          {/* Header */}
          <DialogTitle
            sx={{
              px: 3,
              py: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #1a2332 0%, #0f172a 100%)",
              color: "#fff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.12)",
                }}
              >
                <BusinessCenterIcon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ color: "#fff", lineHeight: 1.3 }}
                >
                  Новое дело
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Заполните обязательные поля и сохраните
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleClose}
              sx={{
                color: "rgba(255,255,255,0.5)",
                "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          {/* Content */}
          <DialogContent
            sx={{
              p: 3,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              bgcolor: "#fafbfc",
            }}
          >
            {/* Клиент и реквизиты */}
            <FormSection>
              <SectionHeader
                icon={<BusinessCenterIcon sx={{ fontSize: 18 }} />}
                title="Клиент и реквизиты дела"
                subtitle="Обязательная информация"
              />
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ position: "relative" }}>
                    <Autocomplete
                      key={`client-${selectedClient?.id || "none"}`}
                      fullWidth
                      options={suggestions}
                      getOptionLabel={(option) => option.name || ""}
                      value={selectedClient}
                      inputValue={clientInputValue}
                      loading={isSuggestLoading}
                      filterOptions={(options) => options}
                      noOptionsText={
                        clientInputValue.trim().length === 0
                          ? "Начните ввод для поиска..."
                          : isSuggestLoading
                            ? "Поиск..."
                            : clientCreatedFromDialog && selectedClient
                              ? `Выбран: ${selectedClient.name}`
                              : "Клиенты не найдены"
                      }
                      onInputChange={handleClientInputChange}
                      onChange={handleClientChange}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value?.id
                      }
                      disableClearable
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ cursor: "pointer" }}>
                          <Box
                            sx={{ display: "flex", flexDirection: "column" }}
                          >
                            <Typography variant="body2" fontWeight={500}>
                              {option.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.id}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Клиент"
                          required
                          placeholder="Введите название клиента..."
                          error={!!errors.client_id}
                          helperText={errors.client_id}
                          sx={singleLineInputSx}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isSuggestLoading ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                            startAdornment: (
                              <InputAdornment position="start" sx={{ mr: 1 }}>
                                <PersonIcon
                                  sx={{ color: "text.disabled", fontSize: 20 }}
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                    <Tooltip title="Добавить нового клиента" arrow>
                      <IconButton
                        onClick={() => setCreateClientDialogOpen(true)}
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 1,
                          bgcolor: "primary.main",
                          color: "#fff",
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            bgcolor: "primary.dark",
                            transform: "translateY(-50%) scale(1.1)",
                            width: 40,
                            height: 40,
                          },
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    fullWidth
                    options={expertSuggestions}
                    getOptionLabel={(option) => option.name || ""}
                    multiple
                    value={selectedExperts}
                    inputValue={expertInputValue}
                    loading={isExpertSuggestLoading}
                    open={isExpertAutocompleteOpen}
                    onOpen={() => setIsExpertAutocompleteOpen(true)}
                    onClose={(_event, reason) => {
                      if (reason !== "toggleInput") {
                        setIsExpertAutocompleteOpen(false);
                      }
                    }}
                    disableCloseOnSelect
                    filterOptions={(options) => options}
                    noOptionsText={
                      expertInputValue.trim().length === 0
                        ? "Начните вводить имя эксперта..."
                        : isExpertSuggestLoading
                          ? "Поиск..."
                          : "Ничего не найдено"
                    }
                    onInputChange={handleExpertInputChange}
                    onChange={handleExpertChange}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 0.5,
                          borderRadius: 1,
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          overflow: "hidden",
                          zIndex: 50,
                          opacity: 1,
                          transform: "scale(1)",
                          transformOrigin: "top center",
                          transition: "all 0.2s ease",
                        },
                      },
                      popper: {
                        sx: { zIndex: 50 },
                      },
                      listbox: {
                        sx: {
                          py: 0.5,
                          "& .MuiAutocomplete-option": {
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": { bgcolor: "#EAF4FF" },
                          },
                        },
                      },
                      popupIndicator: {
                        sx: {
                          mr: 0.25,
                          "& .MuiSvgIcon-root": { fontSize: 20 },
                        },
                      },
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        return (
                          <Chip
                            {...tagProps}
                            key={option.id}
                            label={option.name}
                            size="small"
                            onDelete={() => handleRemoveExpertTag(option.id)}
                            deleteIcon={
                              <CloseIcon
                                sx={{
                                  fontSize: 16,
                                  color: "#6C757D",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  "&:hover": { color: "#1D4ED8" },
                                }}
                              />
                            }
                            sx={{
                              borderRadius: 1,
                              px: 0.25,
                              bgcolor: "#EEF3FF",
                              border: "1px solid #DCE7FF",
                              color: "#1A1C1E",
                              "& .MuiChip-label": {
                                px: 1,
                                py: 0.125,
                                lineHeight: 1.35,
                              },
                              "& .MuiChip-deleteIcon": {
                                mr: 0.25,
                                ml: 0.5,
                              },
                            }}
                          />
                        );
                      })
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option.id} style={{ cursor: "pointer" }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2" fontWeight={500}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Эксперт
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label=""
                        placeholder="Добавить эксперта..."
                        sx={{
                          ...singleLineInputSx,
                          "& .MuiInputBase-root": {
                            ...singleLineInputSx["& .MuiInputBase-root"],
                            alignItems: "center",
                            py: 0.5,
                          },
                          "& .MuiAutocomplete-input": {
                            lineHeight: 1.45,
                          },
                        }}
                        inputRef={expertInputRef}
                        onFocus={() => setIsExpertAutocompleteOpen(true)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isExpertSuggestLoading ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                          startAdornment: (
                            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  mr: 1,
                                  color: "text.secondary",
                                  flexShrink: 0,
                                }}
                              >
                                <PersonIcon sx={{ fontSize: 18 }} />
                              </Box>
                              {params.InputProps.startAdornment}
                            </Box>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="№ п/п"
                    required
                    value={formData.number}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        number: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("number");
                    }}
                    error={!!errors.number}
                    helperText={errors.number}
                    autoFocus
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Номер дела"
                    required
                    value={formData.case_number}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        case_number: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("case_number");
                    }}
                    error={!!errors.case_number}
                    helperText={errors.case_number}
                    sx={singleLineInputSx}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Объект и орган */}
            <FormSection>
              <SectionHeader
                icon={<LocationOnIcon sx={{ fontSize: 18 }} />}
                title="Объект и орган"
                subtitle="Сведения о предмете и рассматривающем органе"
              />
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Суд / Орган"
                    required
                    value={formData.authority}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        authority: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("authority");
                    }}
                    error={!!errors.authority}
                    helperText={errors.authority}
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="ФИО судьи"
                    value={formData.judge_name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        judge_name: e.target.value,
                      }))
                    }
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Вид экспертизы"
                    required
                    value={formData.case_type}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        case_type: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("case_type");
                    }}
                    error={!!errors.case_type}
                    helperText={errors.case_type}
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Тип объекта"
                    required
                    value={formData.object_type}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        object_type: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("object_type");
                    }}
                    error={!!errors.object_type}
                    helperText={errors.object_type}
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Адрес объекта"
                    required
                    multiline
                    minRows={2}
                    value={formData.object_address}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        object_address: e.target.value,
                      }));
                      if (e.target.value.trim()) clearError("object_address");
                    }}
                    error={!!errors.object_address}
                    helperText={errors.object_address}
                    sx={{
                      "& .MuiInputBase-root": {
                        minHeight: INPUT_HEIGHT * 2,
                        boxSizing: "border-box",
                        px: 1.5,
                        width: "100%",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: 0.75,
                        boxSizing: "border-box",
                        width: "100%",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          sx={{ alignSelf: "flex-start", mt: 0.5 }}
                        >
                          <LocationOnIcon
                            sx={{ color: "text.disabled", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Статус и сроки */}
            <FormSection>
              <SectionHeader
                icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                title="Статус и сроки"
              />
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Статус</InputLabel>
                    <Select
                      fullWidth
                      value={formData.status}
                      label="Статус"
                      onChange={(e) =>
                        handleFieldChange(
                          "status",
                          e.target.value as CaseStatus,
                        )
                      }
                      sx={{
                        height: INPUT_HEIGHT,
                        "& .MuiSelect-select": {
                          display: "flex",
                          alignItems: "center",
                          py: 0,
                          width: "100%",
                        },
                        "& .MuiOutlinedInput-input": { py: 0, width: "100%" },
                      }}
                    >
                      {Object.entries(CASE_STATUS_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            <Chip
                              label={label}
                              size="small"
                              color={CASE_STATUS_COLORS[value as CaseStatus]}
                              variant="filled"
                              sx={{
                                fontWeight: "medium",
                                fontSize: "0.7rem",
                                height: 22,
                                cursor: "pointer",
                              }}
                            />
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Дата начала"
                    type="date"
                    value={dayjs(formData.start_date).format("YYYY-MM-DD")}
                    onChange={(e) =>
                      handleFieldChange(
                        "start_date",
                        dayjs(e.target.value).toISOString(),
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={singleLineInputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Срок выполнения"
                    type="date"
                    value={dayjs(formData.deadline).format("YYYY-MM-DD")}
                    onChange={(e) =>
                      handleFieldChange(
                        "deadline",
                        dayjs(e.target.value).toISOString(),
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={singleLineInputSx}
                  />
                </Grid>
              </Grid>
            </FormSection>

            {/* Финансы - ✅ ИСПРАВЛЕНО */}
            <FormSection>
              <SectionHeader
                icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />}
                title="Финансы"
                subtitle="Все суммы в рублях"
              />
              <Grid container spacing={2.5} alignItems="stretch">
                <FinancialField
                  field="cost"
                  label="Стоимость"
                  value={financialValues.cost}
                  onChange={(v) => handleFinancialChange("cost", v)}
                />
                <FinancialField
                  field="bank_transfer_amount"
                  label="Безналичные"
                  value={financialValues.bank_transfer_amount}
                  onChange={(v) =>
                    handleFinancialChange("bank_transfer_amount", v)
                  }
                />
                <FinancialField
                  field="cash_amount"
                  label="Наличные"
                  value={financialValues.cash_amount}
                  onChange={(v) => handleFinancialChange("cash_amount", v)}
                />
                <FinancialField
                  field="remaining_debt"
                  label="Остаток долга"
                  value={financialValues.remaining_debt}
                  onChange={(v) => handleFinancialChange("remaining_debt", v)}
                />
              </Grid>
            </FormSection>

            {/* Стороны дела */}
            <FormSection>
              <SectionHeader
                icon={<PersonIcon sx={{ fontSize: 18 }} />}
                title="Стороны дела"
              />
              <Grid container spacing={2.5} alignItems="stretch">
                <PartyField
                  field="plaintiff"
                  label="Истец"
                  value={formData.plaintiff || ""}
                  onChange={handlePartyChange}
                />
                <PartyField
                  field="defendant"
                  label="Ответчик"
                  value={formData.defendant || ""}
                  onChange={handlePartyChange}
                />
              </Grid>
            </FormSection>

            {/* Примечания */}
            <FormSection>
              <SectionHeader
                icon={<DescriptionIcon sx={{ fontSize: 18 }} />}
                title="Примечания"
              />
              <TextField
                fullWidth
                label="Примечания"
                multiline
                rows={4}
                value={formData.remarks || ""}
                onChange={(e) => handleFieldChange("remarks", e.target.value)}
                placeholder="Дополнительная информация о деле..."
                sx={{
                  "& .MuiInputBase-root": {
                    minHeight: INPUT_HEIGHT * 4,
                    boxSizing: "border-box",
                    px: 1.5,
                    width: "100%",
                  },
                  "& .MuiOutlinedInput-input": {
                    py: 0.75,
                    boxSizing: "border-box",
                    width: "100%",
                  },
                  "& textarea.MuiInputBase-inputMultiline": {
                    width: "100%",
                    boxSizing: "border-box",
                  },
                }}
              />
            </FormSection>
          </DialogContent>

          {/* Footer */}
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              bgcolor: "#fafbfc",
              borderTop: "1px solid",
              borderColor: "divider",
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              size="medium"
              color="inherit"
              sx={{
                borderColor: "divider",
                color: "text.secondary",
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="medium"
              disabled={!isFormValid || isPending}
              sx={{
                minWidth: 140,
                borderRadius: "8px",
                fontWeight: 600,
                boxShadow: "none",
                "&:not(:disabled):hover": {
                  boxShadow: "0 4px 12px rgba(25,39,58,0.35)",
                },
              }}
            >
              {isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                "Создать дело"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Модальное окно создания клиента */}
        <ClientCreateDialog
          open={createClientDialogOpen}
          onClose={() => setCreateClientDialogOpen(false)}
          onSubmit={handleCreateClient}
          isLoading={createClient.isPending}
        />
      </>
    );
  },
);

CreateCaseDialog.displayName = "CreateCaseDialog";

export default CreateCaseDialog;
