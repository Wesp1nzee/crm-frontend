import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
  Alert,
  alpha,
} from "@mui/material";
import { Add, AccountBalance, Gavel, PersonOutline, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useClients, useCreateClient } from "../../shared/hooks/useClients";
import { useState, useEffect } from "react";
import { ClientCreateDialog } from "./ClientCreateDialog";
import { notificationService } from "../../shared/services/notifications";
import { PaginationControls } from "../../shared/ui/PaginationControls";
import { Select, MenuItem, FormControl, InputLabel, Stack } from "@mui/material";
import type { ClientFilters } from "../../entities/client/types";
import type { ClientCreateRequest } from "../../entities/client/types";

const TYPE_ICONS = {
  legal: <AccountBalance sx={{ fontSize: 18 }} />,
  individual: <PersonOutline sx={{ fontSize: 18 }} />,
  court: <Gavel sx={{ fontSize: 18 }} />,
};

export function ClientListPage() {
  const navigate = useNavigate();
  const CLIENT_LIST_STORAGE_KEY = "crm:clients:list:filters:v1";

  function loadFromStorage(): Partial<ClientFilters> | null {
    try {
      const raw = localStorage.getItem(CLIENT_LIST_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Partial<ClientFilters>;
    } catch (e) {
      console.warn("[ClientList] failed to load storage", e);
      return null;
    }
  }

  function saveToStorage(filters: ClientFilters) {
    try {
      const toPersist = { ...filters };
      localStorage.setItem(CLIENT_LIST_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.warn("[ClientList] failed to save storage", e);
    }
  }

  const [filters, setFilters] = useState<ClientFilters>(() => {
    const defaults: ClientFilters = { page: 1, limit: 20, sort_by: "name", sort_dir: "asc" };
    const saved = loadFromStorage();
    if (saved) return { ...defaults, ...saved, page: saved.page ?? defaults.page, limit: saved.limit ?? defaults.limit };
    return defaults;
  });

  useEffect(() => { saveToStorage(filters); }, [filters]);

  const {
    data: clients,
    isLoading: clientsLoading,
    error: clientsError,
    refetch,
  } = useClients(filters);

  const handleSortClick = (field: NonNullable<ClientFilters["sort_by"]>) => {
    setFilters((prev) => {
      const current = prev.sort_by;
      const currentDir = prev.sort_dir ?? "asc";
      if (current === field) {
        return { ...prev, sort_dir: currentDir === "asc" ? "desc" : "asc", page: 1 };
      }
      return { ...prev, sort_by: field, sort_dir: "asc", page: 1 };
    });
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const createClient = useCreateClient();

  const handleCreateClient = async (formData: ClientCreateRequest) => {
    try {
      await createClient.mutateAsync(formData);
      setCreateDialogOpen(false);
      notificationService.success("Клиент успешно создан");
      refetch();
    } catch (error: any) {
      console.error("Ошибка создания клиента:", error);
      notificationService.error(
        error?.response?.data?.detail || "Ошибка создания клиента",
      );
    }
  };

  if (clientsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (clientsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки клиентов: {(clientsError as Error).message}
      </Alert>
    );
  }

  const currentPage = clients?.meta.current_page ?? 1;
  const totalPages = clients?.meta.total_pages ?? 1;
  const totalItems = clients?.meta.total_items ?? 0;
  const hasNext = clients?.meta.has_next ?? false;
  const hasPrev = clients?.meta.has_prev ?? false;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4">Клиенты</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего: {totalItems} клиентов
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Добавить клиента
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: 4, overflow: "hidden" }}
      >
        <Table
          sx={{
            "& th:first-of-type, & td:first-of-type": { pl: 4 },
            "& th:last-of-type, & td:last-of-type": { pr: 4 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSortClick("name")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Название
                  {filters.sort_by === "name" && (filters.sort_dir === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                </Box>
              </TableCell>
              <TableCell>Контакты</TableCell>
              <TableCell sx={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSortClick("type")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Тип
                  {filters.sort_by === "type" && (filters.sort_dir === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                </Box>
              </TableCell>
              <TableCell>ИНН</TableCell>
              <TableCell sx={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSortClick("created_at")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Создан
                  {filters.sort_by === "created_at" && (filters.sort_dir === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                </Box>
              </TableCell>
              <TableCell>Дела</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients?.items && clients.items.length > 0 ? (
              clients.items.map((client, index) => (
                <TableRow
                  key={client.id}
                  hover
                  onClick={() => navigate(`/crm/clients/${client.id}`)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: (theme) =>
                      index % 2 === 1
                        ? alpha(theme.palette.common.black, 0.02)
                        : "transparent",
                  }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium" textAlign="left">{client.name}</Typography>
                    {client.short_name && <Typography variant="caption" color="text.secondary">{client.short_name}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {client.email || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {client.phone || "Телефон не указан"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      color="text.secondary"
                    >
                      {TYPE_ICONS[client.type]}
                      <Typography variant="body2" color="text.primary">
                        {client.type === "legal"
                          ? "ЮЛ"
                          : client.type === "individual"
                            ? "ФЛ"
                            : "Суд"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{client.inn || "—"}</TableCell>
                  <TableCell>{new Date(client.created_at).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={`${client.active_cases} активных`}
                        size="small"
                        sx={{ bgcolor: "rgba(79,144,255,0.12)" }}
                      />
                      <Chip
                        label={`${client.total_cases} всего`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/crm/cases?client=${client.id}`);
                      }}
                    >
                      Дела
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        hasPrev={hasPrev}
        hasNext={hasNext}
        limit={filters.limit}
        onLimitChange={(nextLimit) => setFilters((p) => ({ ...p, limit: nextLimit, page: 1 }))}
        onPrev={() => setFilters((p) => ({ ...p, page: Math.max((p.page ?? 1) - 1, 1) }))}
        onNext={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
      />

      <ClientCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />
    </Box>
  );
}
