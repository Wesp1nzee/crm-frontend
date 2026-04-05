// src/shared/ui/CourtSuggestInput.tsx
import React, { useCallback } from "react";
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Box,
  Typography,
  type AutocompleteRenderInputParams,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import { useCourtSuggest } from "../hooks/useCourtSuggest";
import type { CourtSuggestion, CourtType } from "../../entities/dadata/types";

interface CourtSuggestInputProps {
  value: string;
  onChange: (value: string, suggestion?: CourtSuggestion) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  count?: number;
  minQueryLength?: number;
  required?: boolean;
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

export default function CourtSuggestInput({
  value,
  onChange,
  label = "Суд",
  placeholder = "Начните вводить название суда...",
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = "small",
  count,
  minQueryLength,
  required = false,
}: CourtSuggestInputProps) {
  const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
    useCourtSuggest({ count, minQueryLength });

  const open = suggestions.length > 0;

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string, reason: string) => {
      if (reason === "clear") {
        clearSuggestions();
        onChange("", undefined);
      } else if (reason === "input") {
        onChange(newInputValue, undefined);
        if (newInputValue.trim().length > 0) {
          fetchSuggestions(newInputValue);
        } else {
          clearSuggestions();
        }
      } else if (reason === "reset") {
        onChange(newInputValue, undefined);
      }
    },
    [fetchSuggestions, clearSuggestions, onChange],
  );

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: CourtSuggestion | string | null) => {
      if (typeof newValue === "string") {
        onChange(newValue, undefined);
      } else if (newValue) {
        clearSuggestions();
        onChange(newValue.unrestricted_value, newValue);
      } else {
        onChange("", undefined);
      }
    },
    [onChange, clearSuggestions],
  );

  const renderInput = useCallback(
    (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        label={label}
        placeholder={placeholder}
        required={required}
        error={error}
        helperText={helperText}
        variant="outlined"
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {isLoading && <CircularProgress color="inherit" size={20} />}
              <InputAdornment position="end">
                <GavelIcon color="action" fontSize="small" />
              </InputAdornment>
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    ),
    [label, placeholder, required, error, helperText, isLoading],
  );

  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      open={open}
      onOpen={undefined}
      onClose={undefined}
      loading={isLoading}
      inputValue={value}
      onInputChange={handleInputChange}
      onChange={handleChange}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.value
      }
      filterOptions={(options) => options}
      renderOption={(props, option) => (
        <li {...props} key={props.key}>
          <GavelIcon
            sx={{ mr: 1, color: "text.secondary", flexShrink: 0 }}
            fontSize="small"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {option.value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Chip
                label={COURT_TYPE_NAMES[option.court_type] || option.court_type}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "10px" }}
              />
              <Typography variant="caption" color="text.secondary">
                {option.code}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.25, display: "block" }}>
              {option.address}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={renderInput}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      noOptionsText=""
      sx={{
        "& .MuiAutocomplete-listbox": { maxHeight: "300px" },
      }}
    />
  );
}
