// src/shared/ui/FolderPicker.tsx
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  CreateNewFolder as CreateNewFolderIcon,
} from "@mui/icons-material";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFolders } from "../../shared/hooks/useFolders";
import type { FolderListItem } from "../../entities/folder/types";

const FOLDER_LIMIT = 100;

export interface FolderPickerProps {
  value?: string | null;
  onChange?: (folderId: string | null, folderName?: string | null, caseId?: string | null) => void;
  excludeCaseFolders?: boolean;
  disabled?: boolean;
  open: boolean;
  onClose: () => void;
  title?: string;
  confirmText?: string;
  immediateSelect?: boolean;
  /** Callback to create a folder at the current navigation level.
   *  Returns the created folder's id and name. */
  onCreateFolder?: (name: string, parentId: string | null) => Promise<{ id: string; name: string }>;
}

export function FolderPicker({
  value,
  onChange,
  excludeCaseFolders = true,
  disabled = false,
  open,
  onClose,
  title = "Выберите папку",
  confirmText = "Применить",
  immediateSelect = false,
  onCreateFolder,
}: FolderPickerProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(value ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderListItem[]>([]);

  // Create-folder state
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const allFoldersRef = useRef<Map<string, FolderListItem>>(new Map());

  useEffect(() => {
    if (open) {
      setCurrentParentId(null);
      setBreadcrumbs([]);
      setSearchQuery("");
      setSelectedFolderId(value ?? null);
      setShowCreateInput(false);
      setNewFolderName("");
      allFoldersRef.current.clear();
    }
  }, [open, value]);

  useEffect(() => {
    setSelectedFolderId(value ?? null);
  }, [value]);

  const { data, isLoading, error, refetch } = useFolders(
    {
      parent_id: currentParentId,
      include_case_folders: !excludeCaseFolders,
      search: searchQuery || undefined,
      limit: FOLDER_LIMIT,
    },
    open,
  );

  const folders = useMemo(() => data?.items ?? [], [data?.items]);

  useEffect(() => {
    for (const f of folders) {
      allFoldersRef.current.set(f.id, f);
    }
  }, [folders]);

  // ── Navigation ──────────────────────────────────────────────────────

  /** Navigate into a folder: push to breadcrumbs, set as current parent. */
  const handleNavigateToFolder = useCallback(
    (folder: FolderListItem) => {
      setCurrentParentId(folder.id);
      setBreadcrumbs((prev) => [...prev, folder]);
      setSearchQuery("");
    },
    [],
  );

  /** Navigate to a folder by id + name (used after creating a folder). */
  const handleNavigateToFolderId = useCallback(
    (folderId: string, folderName: string) => {
      setCurrentParentId(folderId);
      setBreadcrumbs((prev) => [
        ...prev,
        { id: folderId, name: folderName, parent_id: currentParentId } as FolderListItem,
      ]);
      setSearchQuery("");
    },
    [currentParentId],
  );

  /** Navigate to a specific breadcrumb level. */
  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      const target = breadcrumbs[index];
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setCurrentParentId(target.id);
      setBreadcrumbs(newBreadcrumbs);
    },
    [breadcrumbs],
  );

  const handleNavigateUp = useCallback(() => {
    if (breadcrumbs.length === 0) return;
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    const last = newBreadcrumbs[newBreadcrumbs.length - 1];
    setCurrentParentId(last?.id ?? null);
    setBreadcrumbs(newBreadcrumbs);
  }, [breadcrumbs]);

  const handleNavigateHome = useCallback(() => {
    setCurrentParentId(null);
    setBreadcrumbs([]);
  }, []);

  // ── Create folder ───────────────────────────────────────────────────

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name || !onCreateFolder) return;
    setCreatingFolder(true);
    try {
      const created = await onCreateFolder(name, currentParentId);
      setNewFolderName("");
      setShowCreateInput(false);
      await refetch();
      // Auto-navigate into the newly created folder
      handleNavigateToFolderId(created.id, created.name);
    } catch {
      // Error handled by parent
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, onCreateFolder, currentParentId, refetch, handleNavigateToFolderId]);

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateFolder();
      } else if (e.key === "Escape") {
        setShowCreateInput(false);
        setNewFolderName("");
      }
    },
    [handleCreateFolder],
  );

  // ── Selection ───────────────────────────────────────────────────────

  const handleSelectCurrentFolder = useCallback(
    (folderId: string, folderName?: string, caseId?: string | null) => {
      setSelectedFolderId(folderId);
      if (immediateSelect && onChange) {
        onChange(folderId, folderName ?? null, caseId ?? null);
        onClose();
      }
    },
    [immediateSelect, onChange, onClose],
  );

  const handleConfirm = useCallback(() => {
    if (onChange) {
      const targetId = selectedFolderId ?? currentParentId;
      let folderName: string | null = null;
      let caseId: string | null = null;
      if (targetId) {
        const found = allFoldersRef.current.get(targetId);
        folderName = found?.name ?? null;
        caseId = found?.case_id ?? null;
      }
      onChange(targetId, folderName, caseId);
    }
    onClose();
  }, [onChange, selectedFolderId, currentParentId, onClose]);

  const handleCancel = useCallback(() => {
    setSelectedFolderId(value ?? null);
    onClose();
  }, [onClose, value]);

  // ── Helpers ─────────────────────────────────────────────────────────

  const isFolderSelectable = useCallback(
    (folder: FolderListItem): boolean => {
      if (folder.is_case_root) return false;
      return true;
    },
    [],
  );

  const currentFolderName = useMemo(() => {
    if (breadcrumbs.length === 0) return null;
    return breadcrumbs[breadcrumbs.length - 1].name;
  }, [breadcrumbs]);

  const filteredFolders = useMemo(() => {
    if (searchQuery) {
      return folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return folders.filter((f) => f.parent_id === currentParentId);
  }, [folders, searchQuery, currentParentId]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={200}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18)",
          overflow: "hidden",
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Search */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск папки..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
              endAdornment: searchQuery ? (
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  sx={{ color: "text.secondary" }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : undefined,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        </Box>

        {/* Breadcrumb bar */}
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: "background.default",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            minHeight: 40,
            overflowX: "auto",
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 2,
            },
          }}
        >
          <IconButton
            onClick={handleNavigateHome}
            size="small"
            disabled={breadcrumbs.length === 0}
            sx={{ color: "text.secondary", flexShrink: 0 }}
            title="Корень"
          >
            <HomeIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={handleNavigateUp}
            size="small"
            disabled={breadcrumbs.length === 0}
            sx={{ color: "text.secondary", flexShrink: 0 }}
            title="Назад"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              flexShrink: 0,
              px: 0.5,
            }}
          >
            {breadcrumbs.length === 0 ? "Корень" : ""}
          </Typography>

          {breadcrumbs.map((crumb, index) => (
            <Box
              key={crumb.id}
              sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
            >
              {index > 0 && (
                <ChevronRightIcon
                  sx={{ fontSize: 16, color: "text.disabled" }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  cursor: "pointer",
                  fontWeight: index === breadcrumbs.length - 1 ? 700 : 400,
                  color:
                    index === breadcrumbs.length - 1
                      ? "text.primary"
                      : "primary.main",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    textDecoration: "underline",
                    color: "primary.dark",
                  },
                }}
                onClick={() => handleBreadcrumbClick(index)}
              >
                {crumb.name}
              </Typography>
            </Box>
          ))}

          {/* Spacer + Create folder button */}
          <Box sx={{ flex: 1 }} />
          {onCreateFolder && !immediateSelect && (
            <Button
              size="small"
              variant="text"
              startIcon={<CreateNewFolderIcon sx={{ fontSize: 18 }} />}
              onClick={() => setShowCreateInput(true)}
              sx={{
                flexShrink: 0,
                textTransform: "none",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "primary.main",
                whiteSpace: "nowrap",
              }}
            >
              Создать папку
            </Button>
          )}
        </Box>

        {/* Create folder inline input */}
        {showCreateInput && onCreateFolder && (
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "primary.main",
              bgcolor: (t: any) => t.palette.primary.main + "0A",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CreateNewFolderIcon sx={{ color: "primary.main", fontSize: 20, flexShrink: 0 }} />
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="Название новой папки"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              disabled={creatingFolder}
              InputProps={{
                endAdornment: newFolderName.trim() ? (
                  <IconButton
                    size="small"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder}
                    sx={{ color: "primary.main" }}
                  >
                    {creatingFolder ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CheckIcon fontSize="small" />
                    )}
                  </IconButton>
                ) : undefined,
              }}
              sx={{
                "& .MuiInputBase-root": { height: 36, fontSize: "0.875rem" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
              }}
            />
            <IconButton
              size="small"
              onClick={() => {
                setShowCreateInput(false);
                setNewFolderName("");
              }}
              disabled={creatingFolder}
              sx={{ color: "text.secondary", flexShrink: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Folder list */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1,
            bgcolor: "background.paper",
          }}
        >
          {isLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: 200 }}
            >
              <CircularProgress size={32} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Загрузка папок...
              </Typography>
            </Stack>
          ) : error ? (
            <Alert
              severity="error"
              action={
                <Button size="small" onClick={() => refetch()}>
                  Повторить
                </Button>
              }
              sx={{ m: 2 }}
            >
              Не удалось загрузить папки
            </Alert>
          ) : filteredFolders.length === 0 ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: 200 }}
            >
              <FolderIcon sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery
                  ? "Папки не найдены"
                  : "Нет доступных папок"}
              </Typography>
            </Stack>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;
                const isSelectable = isFolderSelectable(folder);
                const hasChildren = folder.children_count > 0;

                return (
                  <ListItemButton
                    key={folder.id}
                    onClick={() => {
                      if (immediateSelect && isSelectable) {
                        handleSelectCurrentFolder(folder.id, folder.name, folder.case_id);
                      } else if (isSelectable) {
                        handleNavigateToFolder(folder);
                      }
                    }}
                    onDoubleClick={() => {
                      if (immediateSelect && isSelectable && hasChildren) {
                        handleNavigateToFolder(folder);
                      }
                    }}
                    sx={{
                      width: "100%",
                      pl: 2,
                      pr: 1,
                      py: 0.75,
                      borderRadius: 1,
                      backgroundColor: isSelected ? "action.selected" : "transparent",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "action.selected"
                          : "action.hover",
                      },
                      opacity: isSelectable ? 1 : 0.6,
                      cursor: isSelectable ? "pointer" : "default",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isSelectable ? "inherit" : "text.disabled",
                      }}
                    >
                      {folder.is_case_root ? (
                        <FolderOpenIcon sx={{ color: "primary.main" }} />
                      ) : (
                        <FolderIcon sx={{ color: "warning.main" }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelectable ? "text.primary" : "text.secondary",
                          }}
                        >
                          {folder.name}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                          {folder.case_number && (
                            <Chip
                              label={folder.case_number}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            />
                          )}
                          {hasChildren && (
                            <Typography variant="caption" color="text.secondary">
                              {folder.children_count} папок
                            </Typography>
                          )}
                          {!isSelectable && (
                            <LockIcon sx={{ fontSize: 14, color: "error.main" }} />
                          )}
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />

                    {immediateSelect && hasChildren && isSelectable && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToFolder(folder);
                        }}
                        sx={{ color: "text.secondary", ml: 0.5 }}
                        title="Открыть папку"
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    )}

                    {!immediateSelect && isSelectable && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.5 }}
                      >
                        {hasChildren && (
                          <ChevronRightIcon
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                        )}
                      </Box>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        {/* Actions */}
        {!immediateSelect && (
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {currentParentId
                ? `Будет выбрана папка «${currentFolderName ?? currentParentId}»`
                : "Будет выбран корень"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={handleCancel}
                variant="outlined"
                size="large"
                disabled={disabled}
              >
                Отмена
              </Button>
              <Button
                onClick={handleConfirm}
                variant="contained"
                size="large"
                disabled={disabled}
                startIcon={<CheckIcon />}
              >
                {confirmText}
              </Button>
            </Box>
          </Box>
        )}

        {immediateSelect && (
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              bgcolor: "background.paper",
            }}
          >
            <Button onClick={handleCancel} variant="outlined" size="large">
              Отмена
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
