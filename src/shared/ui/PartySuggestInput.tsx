// src/shared/ui/PartySuggestInput.tsx
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
import BusinessIcon from "@mui/icons-material/Business";
import { usePartySuggest } from "../hooks/usePartySuggest";
import type {
  PartySuggestion,
  PartyType,
  PartyStatus,
} from "../../entities/dadata/types";

interface PartySuggestInputProps {
  value: string;
  onChange: (value: string, suggestion?: PartySuggestion) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  count?: number;
  minQueryLength?: number;
  partyType?: PartyType;
  status?: PartyStatus[];
  okved?: string[];
  required?: boolean;
}

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "info"> = {
  ACTIVE: "success",
  LIQUIDATING: "warning",
  LIQUIDATED: "error",
  BANKRUPT: "error",
  REORGANIZING: "info",
};

export default function PartySuggestInput({
  value,
  onChange,
  label = "Организация",
  placeholder = "Начните вводить название или ИНН...",
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = "small",
  count,
  minQueryLength,
  partyType,
  status,
  okved,
  required = false,
}: PartySuggestInputProps) {
  const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
    usePartySuggest({ count, minQueryLength, partyType, status, okved });

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
    (_event: React.SyntheticEvent, newValue: PartySuggestion | string | null) => {
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
                <BusinessIcon color="action" fontSize="small" />
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
          <BusinessIcon
            sx={{ mr: 1, color: "text.secondary", flexShrink: 0 }}
            fontSize="small"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {option.value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                ИНН: {option.inn}
              </Typography>
              <Chip
                label={option.type === "LEGAL" ? "ЮЛ" : "ИП"}
                size="small"
                color={option.type === "LEGAL" ? "primary" : "info"}
                sx={{ height: 18, fontSize: "10px" }}
              />
              <Chip
                label={option.state_status}
                size="small"
                color={STATUS_COLORS[option.state_status] || "default"}
                sx={{ height: 18, fontSize: "10px" }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.25, display: "block" }}>
              {option.address_unrestricted_value || option.address_value}
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
