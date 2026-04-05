// src/shared/ui/AddressSuggestInput.tsx
import React, { useCallback } from "react";
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  type AutocompleteRenderInputParams,
  type SxProps,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useAddressSuggest } from "../hooks/useAddressSuggest";
import type {
  AddressSuggestion,
  AddressBound,
} from "../../entities/dadata/types";

interface AddressSuggestInputProps {
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  count?: number;
  minQueryLength?: number;
  fromBound?: AddressBound;
  toBound?: AddressBound;
  required?: boolean;
  sx?: SxProps;
}

export default function AddressSuggestInput({
  value,
  onChange,
  label = "Адрес",
  placeholder = "Начните вводить адрес...",
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  size = "small",
  count,
  minQueryLength,
  fromBound,
  toBound,
  required = false,
}: AddressSuggestInputProps) {
  const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
    useAddressSuggest({ count, minQueryLength, fromBound, toBound });

  // Поппер открыт ТОЛЬКО когда есть реальные результаты.
  // Пустой поппер (MuiAutocomplete-popper) рендерится как белая полоса под полем.
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
    (
      _event: React.SyntheticEvent,
      newValue: AddressSuggestion | string | null,
    ) => {
      if (typeof newValue === "string") {
        onChange(newValue, undefined);
      } else if (newValue) {
        clearSuggestions(); // закрываем поппер через обнуление suggestions
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
                <LocationOnIcon color="action" fontSize="small" />
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
        <li {...props} key={option.value}>
          <LocationOnIcon
            sx={{ mr: 1, color: "text.secondary", flexShrink: 0 }}
            fontSize="small"
          />
          <span>{option.unrestricted_value || option.value}</span>
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