// src/shared/ui/CourtDetailPanel.tsx
import React from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  useTheme,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LanguageIcon from "@mui/icons-material/Language";
import Save from "@mui/icons-material/Save";
import type { CourtSuggestion, CourtType } from "../../entities/dadata/types";

interface CourtDetailPanelProps {
  court: CourtSuggestion;
  onFillForm: (court: CourtSuggestion) => void;
}

const COURT_TYPE_NAMES: Record<CourtType, string> = {
  AV: "Апелляционный военный суд",
  AJ: "Апелляционный суд общей юрисдикции",
  VS: "Верховный Суд РФ",
  GV: "Гарнизонный военный суд",
  KV: "Кассационный военный суд",
  KJ: "Кассационный суд общей юрисдикции",
  OS: "Областной и равный ему суд",
  OV: "Окружной (флотский) военный суд",
  RS: "Районный, городской, межрайонный суд",
  AA: "Арбитражный апелляционный суд",
  AO: "Арбитражный суд округа",
  AI: "Суд по интеллектуальным правам",
  AS: "Арбитражный суд области",
  MS: "Мировой суд",
};

export default function CourtDetailPanel({
  court,
  onFillForm,
}: CourtDetailPanelProps) {
  const theme = useTheme();

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
          <GavelIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Данные суда
          </Typography>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ p: 3, pt: 2, flexGrow: 1 }}>
        {/* Court Type Chip */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={COURT_TYPE_NAMES[court.court_type] || court.court_type_name}
            icon={<GavelIcon />}
            color="primary"
            size="small"
            sx={{ fontWeight: 500 }}
          />
          {court.code && (
            <Chip
              label={court.code}
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontWeight: 500 }}
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Court Name */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Полное наименование
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {court.name}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {court.address && (
            <InfoField
              label="Адрес"
              value={court.address}
              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
            />
          )}

          {court.legal_address && court.legal_address !== court.address && (
            <InfoField
              label="Юридический адрес"
              value={court.legal_address}
              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
            />
          )}

          {court.inn && (
            <InfoField
              label="ИНН"
              value={court.inn}
              icon={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>#</Typography>}
            />
          )}

          {court.website && (
            <InfoField
              label="Сайт"
              value={court.website}
              icon={<LanguageIcon sx={{ fontSize: 14 }} />}
              isLink
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
          onClick={() => onFillForm(court)}
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
  isLink?: boolean;
}

function InfoField({ label, value, icon, isLink }: InfoFieldProps) {
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
      {isLink ? (
        <Typography
          variant="body2"
          fontWeight={500}
          component="a"
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          color="primary.main"
          sx={{
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {value}
        </Typography>
      ) : (
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      )}
    </Box>
  );
}
