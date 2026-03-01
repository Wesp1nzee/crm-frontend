import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

interface PaginationControlsProps {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  hasPrev: boolean;
  hasNext: boolean;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPrev: () => void;
  onNext: () => void;
  limitOptions?: number[];
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  hasPrev,
  hasNext,
  limit,
  onLimitChange,
  onPrev,
  onNext,
  limitOptions = [10, 20, 50, 100],
}: PaginationControlsProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mt={2}
      gap={2}
      flexWrap="wrap"
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Typography variant="body2" color="text.secondary">
          На странице
        </Typography>
        <FormControl size="small">
          <Select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            sx={{ minWidth: 84 }}
          >
            {limitOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box display="flex" alignItems="center" gap={1.5}>
        <Typography variant="body2" color="text.secondary">
          Страница {currentPage}
          {typeof totalPages === "number" ? ` из ${totalPages}` : ""}
          {typeof totalItems === "number" ? `. Всего: ${totalItems}` : ""}
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" disabled={!hasPrev} onClick={onPrev}>
            Назад
          </Button>
          <Button variant="outlined" disabled={!hasNext} onClick={onNext}>
            Вперёд
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
