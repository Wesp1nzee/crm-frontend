// src/shared/ui/PartyDetailPanel.tsx
import React from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  useTheme,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Save from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import type { PartySuggestion } from "../../entities/dadata/types";

interface PartyDetailPanelProps {
  party: PartySuggestion;
  onFillForm: (party: PartySuggestion) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: "success" | "warning" | "error"; icon: React.ReactNode }
> = {
  ACTIVE: {
    label: "Действующая организация",
    color: "success",
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
  },
  LIQUIDATING: {
    label: "В процессе ликвидации",
    color: "warning",
    icon: <WarningIcon sx={{ fontSize: 18 }} />,
  },
  LIQUIDATED: {
    label: "Ликвидирована",
    color: "error",
    icon: <WarningIcon sx={{ fontSize: 18 }} />,
  },
  BANKRUPT: {
    label: "Банкрот",
    color: "error",
    icon: <WarningIcon sx={{ fontSize: 18 }} />,
  },
  REORGANIZING: {
    label: "Реорганизация",
    color: "warning",
    icon: <WarningIcon sx={{ fontSize: 18 }} />,
  },
};

function formatDate(timestamp: number | null | undefined): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PartyDetailPanel({
  party,
  onFillForm,
}: PartyDetailPanelProps) {
  const theme = useTheme();
  const statusConfig = STATUS_CONFIG[party.state_status] || {
    label: party.state_status,
    color: "warning",
    icon: <WarningIcon sx={{ fontSize: 18 }} />,
  };

  return (
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
          <BusinessIcon color="primary" />
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
              statusConfig.color === "success"
                ? theme.palette.success.light
                : theme.palette.warning.light,
            border: `1px solid ${
              statusConfig.color === "success"
                ? theme.palette.success.light
                : theme.palette.warning.light
            }`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {statusConfig.icon}
            <Typography
              variant="caption"
              fontWeight={600}
              color={`${statusConfig.color}.main`}
            >
              {statusConfig.label}
            </Typography>
          </Box>
        </Box>

        {/* Company Type Chip */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={party.type === "LEGAL" ? "Юридическое лицо" : "ИП"}
            icon={party.type === "LEGAL" ? <BusinessIcon /> : <PersonIcon />}
            color={party.type === "LEGAL" ? "primary" : "info"}
            size="small"
            sx={{ fontWeight: 500 }}
          />
          {party.branch_type && (
            <Chip
              label={party.branch_type === "MAIN" ? "Головная" : "Филиал"}
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Full Name */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Полное наименование
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {party.name_full_with_opf}
          </Typography>
        </Box>

        {/* Short Name */}
        {party.name_short && party.name_short !== party.name_full && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Краткое наименование
            </Typography>
            <Typography variant="body2">{party.name_short}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Details */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* INN / KPP / OGRN */}
          <InfoField label="ИНН" value={party.inn} />

          {party.kpp && <InfoField label="КПП" value={party.kpp} />}

          {party.ogrn && (
            <InfoField label="ОГРН" value={party.ogrn} />
          )}

          {/* OKVED */}
          {party.okved && (
            <InfoField label="ОКВЭД" value={party.okved} />
          )}

          {/* Management */}
          {party.management_name && (
            <InfoField
              label="Руководитель"
              value={
                party.management_post
                  ? `${party.management_name} (${party.management_post})`
                  : party.management_name
              }
              icon={<PersonIcon sx={{ fontSize: 14 }} />}
            />
          )}

          {/* Address */}
          <InfoField
            label="Адрес"
            value={party.address_unrestricted_value || party.address_value}
            icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
          />

          {/* Registration Date */}
          {party.state_registration_date && (
            <InfoField
              label="Дата регистрации"
              value={formatDate(party.state_registration_date)}
            />
          )}
        </Box>
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
          onClick={() => onFillForm(party)}
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
