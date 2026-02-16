import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  IconButton,
  TableSortLabel,
  Tooltip,
  Skeleton,
  Autocomplete,
  alpha,
} from '@mui/material';
import {
  Delete,
  Download,
  FolderOutlined,
  DescriptionOutlined,
  CreateNewFolder,
  Upload,
  MoreVert,
  Home,
  Search,
  Person,
  Visibility,
  Edit,
} from '@mui/icons-material';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import {
  useCreateFolder,
  useUploadDocument,
  useDownloadDocument,
  useDeleteDocument,
  useDeleteFolder,
  useDocuments,
  useCaseSuggestions,
  usePreviewDocument,
  useUpdateAsset,
  useDownloadFolder,
} from '../../shared/hooks/useDocuments';
import type { FileSystemEntry } from '../../entities/document/types';
import type { CaseSuggestion } from '../../entities/case/types';
import { EditAssetDialog } from '../../shared/ui/EditAssetDialog';
import { notificationService } from '../../shared/services/notifications';

type SortField = 'name' | 'size' | 'created_at' | 'created_by';
type SortOrder = 'asc' | 'desc';

const fileIcons: Record<string, JSX.Element> = {
  pdf: <DescriptionOutlined sx={{ color: '#D32F2F' }} />,
  doc: <DescriptionOutlined sx={{ color: '#2196F3' }} />,
  docx: <DescriptionOutlined sx={{ color: '#2196F3' }} />,
  xls: <DescriptionOutlined sx={{ color: '#4CAF50' }} />,
  xlsx: <DescriptionOutlined sx={{ color: '#4CAF50' }} />,
  jpg: <DescriptionOutlined sx={{ color: '#FF9800' }} />,
  jpeg: <DescriptionOutlined sx={{ color: '#FF9800' }} />,
  png: <DescriptionOutlined sx={{ color: '#FF9800' }} />,
  zip: <DescriptionOutlined sx={{ color: '#9C27B0' }} />,
  rar: <DescriptionOutlined sx={{ color: '#9C27B0' }} />,
};

const sanitizeAndRender = (str: string) => DOMPurify.sanitize(str);

const actionButtonSx = {
  textTransform: 'none',
  minHeight: 40,
  px: 2,
  borderRadius: 1.5,
  fontWeight: 600,
};

export function DocumentsPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Корень' },
  ]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Контекстное меню
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  // Элемент для меню — сбрасывается ТОЛЬКО при явном закрытии меню без действия
  const [menuEntry, setMenuEntry] = useState<FileSystemEntry | null>(null);

  // Удаление — ОТДЕЛЬНЫЕ состояния, не зависят от меню
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<FileSystemEntry | null>(null);

  // Редактирование — тоже отдельно
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<FileSystemEntry | null>(null);

  const [newFolderName, setNewFolderName] = useState('');
  const [uploadCaseId, setUploadCaseId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseSuggestion | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOverTable, setDragOverTable] = useState(false);
  const [dragOverUploadDialog, setDragOverUploadDialog] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverFolderPathIndex, setDragOverFolderPathIndex] = useState<number | null>(null);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: entries, isLoading, error, refetch } = useDocuments({
    folder_id: currentFolderId,
    search: searchQuery || undefined,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    sort_by: sortField,
    order: sortOrder,
  });

  const { data: caseSuggestions } = useCaseSuggestions(caseSearchQuery);

  const entriesArray = Array.isArray(entries) ? entries : [];
  const total = entriesArray.length === rowsPerPage ? (page + 1) * rowsPerPage + 1 : page * rowsPerPage + entriesArray.length;

  // Мутации
  const createFolder = useCreateFolder();
  const uploadDocument = useUploadDocument();
  const downloadDocument = useDownloadDocument();
  const previewDocument = usePreviewDocument();
  const deleteDocument = useDeleteDocument();
  const deleteFolder = useDeleteFolder();
  const downloadFolder = useDownloadFolder();
  const updateAsset = useUpdateAsset();

  // Отладка: проверка валидности записей
  useEffect(() => {
    if (entriesArray.length > 0) {
      const invalid = entriesArray.filter(e => !e.id || !e.name || !e.type);
      if (invalid.length > 0) {
        console.warn('Найдены некорректные записи:', invalid);
      }
    }
  }, [entriesArray]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Получение иконки для файла
  const getFileIcon = (entry: FileSystemEntry) => {
    if (entry.type === 'folder') {
      return <FolderOutlined color="primary" />;
    }
    const ext = entry.extension?.replace('.', '').toLowerCase() || '';
    return fileIcons[ext] || <DescriptionOutlined color="action" />;
  };

  // Обработчики навигации
  const handleFolderClick = (folder: FileSystemEntry) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setPage(0);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
    setPage(0);
  };

  // Обработчики пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Обработчики сортировки
  const handleSortChange = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Создание папки
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        parent_id: currentFolderId,
      });
      setCreateFolderOpen(false);
      setNewFolderName('');
      setPage(0);
      notificationService.success('Папка успешно создана');
      refetch();
    } catch (error) {
      console.error('Ошибка создания папки:', error);
    }
  };

  // Обработчики загрузки файлов
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      for (const file of selectedFiles) {
        await uploadDocument.mutateAsync({
          file,
          folder_id: currentFolderId,
          case_id: selectedCase?.id || null,
          title: uploadTitle || file.name,
        });
      }
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadCaseId('');
      setUploadTitle('');
      setSelectedCase(null);
      setCaseSearchQuery('');
      notificationService.success(`Успешно загружено файлов: ${selectedFiles.length}`);
      refetch();
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      notificationService.error('Ошибка загрузки файлов. Проверьте логи для подробностей.');
    }
  };

  const handleDownload = (documentId: string) => {
    downloadDocument.mutate(documentId);
  };

  const handleDownloadFolder = (folderId: string) => {
    downloadFolder.mutate(folderId);
  };

  const handlePreview = (documentId: string) => {
    previewDocument.mutate(documentId);
  };

  const handleFileDoubleClick = (entry: FileSystemEntry) => {
    if (entry.type === 'file') {
      handlePreview(entry.id);
    }
  };

  // Обработчики контекстного меню
  // Открытие меню
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, entry: FileSystemEntry) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuEntry(entry);
  };

  // Закрытие меню — сбрасывает ТОЛЬКО menuEntry и menuAnchor
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuEntry(null);
  };

  // Обработчики действий из меню
  // Предпросмотр
  const handleMenuPreview = () => {
    if (menuEntry) {
      handlePreview(menuEntry.id);
    }
    handleMenuClose();
  };

  // Скачать файл
  const handleMenuDownload = () => {
    if (menuEntry) {
      handleDownload(menuEntry.id);
    }
    handleMenuClose();
  };

  // Скачать папку
  const handleMenuDownloadFolder = () => {
    if (menuEntry) {
      handleDownloadFolder(menuEntry.id);
    }
    handleMenuClose();
  };

  // Редактировать — копируем entry в отдельное состояние ДО закрытия меню
  const handleMenuEdit = () => {
    if (menuEntry) {
      setEntryToEdit(menuEntry);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  // Удалить — копируем entry в отдельное состояние ДО закрытия меню
  const handleMenuDelete = () => {
    if (!menuEntry) {
      handleMenuClose();
      return;
    }

    // Валидация
    if (!menuEntry.id || typeof menuEntry.id !== 'string' || menuEntry.id.startsWith('__')) {
      console.warn('Попытка удалить недопустимый элемент:', menuEntry);
      notificationService.warning('Этот элемент нельзя удалить');
      handleMenuClose();
      return;
    }

    if (!menuEntry.name || !menuEntry.type) {
      console.error('Элемент не содержит name или type:', menuEntry);
      notificationService.error('Невозможно удалить: данные повреждены.');
      handleMenuClose();
      return;
    }

    // Сохраняем элемент для удаления ПЕРЕД закрытием меню
    setEntryToDelete(menuEntry);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  // Выполнение удаления
  const handleDelete = async () => {
    if (!entryToDelete?.id || !entryToDelete.type) {
      console.error('handleDelete: некорректный элемент', entryToDelete);
      notificationService.error('Не удалось определить элемент для удаления');
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      return;
    }

    try {
      console.log('Удаление элемента:', {
        id: entryToDelete.id,
        type: entryToDelete.type,
        name: entryToDelete.name,
      });

      if (entryToDelete.type === 'folder') {
        await deleteFolder.mutateAsync(entryToDelete.id);
      } else if (entryToDelete.type === 'file') {
        await deleteDocument.mutateAsync(entryToDelete.id);
      } else {
        throw new Error(`Неизвестный тип элемента: ${entryToDelete.type}`);
      }

      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      notificationService.success('Элемент успешно удалён');

      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      notificationService.error('Ошибка при удалении. Подробности в консоли.');
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  // Выполнение редактирования
  const handleSaveEdit = async (data: any) => {
    if (!entryToEdit) return;
    try {
      const updateData = {
        asset_id: entryToEdit.id,
        asset_type: entryToEdit.type,
        data: {
          ...data,
          ...(entryToEdit.type === 'folder' && data.name ? { name: data.name } : {}),
          ...(entryToEdit.type === 'file' && data.title ? { title: data.title } : {}),
        },
      };
      await updateAsset.mutateAsync(updateData);
      setEditDialogOpen(false);
      setEntryToEdit(null);
      notificationService.success('Изменения успешно сохранены');
      refetch();
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  // Обработчики перемещения файлов и папок
  const handleAssetDrop = async (
    assetId: string,
    assetType: 'file' | 'folder',
    targetFolderId: string | null,
    assetName?: string,
  ) => {
    try {
      const draggedEntry = entriesArray.find((entry) => entry.id === assetId);
      const fallbackName = assetName || draggedEntry?.name;
      const updateData = {
        asset_id: assetId,
        asset_type: assetType,
        data: assetType === 'folder'
          ? {
            parent_id: targetFolderId === null ? null : targetFolderId,
            ...(fallbackName ? { name: fallbackName } : {}),
          }
          : {
            folder_id: targetFolderId === null ? null : targetFolderId,
            ...(fallbackName ? { title: fallbackName } : {}),
          }
      };
      await updateAsset.mutateAsync(updateData);
      notificationService.success('Элемент успешно перемещён');
      refetch();
    } catch (error) {
      console.error('Ошибка перемещения:', error);
    }
  };

  const formatCreatorName = (entry: FileSystemEntry): string => {
    if (entry.created_by_name) {
      return entry.created_by_name;
    }
    if (entry.created_by?.full_name) {
      return entry.created_by.full_name;
    }
    if (entry.created_by?.email) {
      return entry.created_by.email;
    }
    if (entry.created_by_id) {
      return `ID: ${entry.created_by_id}`;
    }
    return 'Неизвестно';
  };

  // Обработчики для пути навигации
  const handlePathDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const hasInternalData = e.dataTransfer.types.includes('application/json');
    if (hasInternalData || Boolean(draggedItemId)) {
      setDragOverFolderPathIndex(index);
    }
  };

  const handlePathDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPathIndex(null);
  };

  const handlePathDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId) {
      setDragOverFolderPathIndex(index);
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePathDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderPathIndex(null);
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData) {
      try {
        const { id, type, name } = JSON.parse(assetData);
        const targetFolderId = folderPath[index].id;
        handleAssetDrop(id, type as 'file' | 'folder', targetFolderId, name);
      } catch (error) {
        console.error('Ошибка парсинга данных перетаскивания:', error);
      }
    }
  };

  // Обработчики для строки таблицы
  const handleRowDragStart = (e: React.DragEvent, entry: FileSystemEntry) => {
    if (entry.id === '__parent_folder__') return;
    setDraggedItemId(entry.id);
    setIsDraggingInternal(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: entry.id,
      type: entry.type,
      name: entry.name,
    }));
    e.dataTransfer.effectAllowed = 'move';
    const dragImage = document.createElement('div');
    dragImage.innerHTML = `
      <div style="
        background: white;
        border: 2px solid #1976d2;
        border-radius: 8px;
        padding: 8px 16px;
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 200px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        font-size: 14px;
        font-weight: 500;
      ">
        ${entry.type === 'folder' ? '<span>📁</span>' : '<span>📄</span>'}
        <span>${entry.name}</span>
      </div>
    `;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    dragImage.style.left = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleRowDragEnd = () => {
    setDraggedItemId(null);
    setIsDraggingInternal(false);
    setDragOverItemId(null);
  };

  const handleRowDragEnter = (e: React.DragEvent, entry: FileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.id === draggedItemId) return;
    if (entry.type === 'folder') {
      const hasInternalData = e.dataTransfer.types.includes('application/json');
      if (hasInternalData) {
        setDragOverItemId(entry.id);
      }
    }
  };

  const handleRowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget;
    if (
      relatedTarget === null ||
      !(relatedTarget instanceof Node) ||
      !e.currentTarget.contains(relatedTarget)
    ) {
      setDragOverItemId(null);
    }
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRowDrop = (e: React.DragEvent, entry: FileSystemEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
    if (draggedItemId === entry.id) return;
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData && entry.type === 'folder') {
      try {
        const { id, type, name } = JSON.parse(assetData);
        handleAssetDrop(id, type as 'file' | 'folder', entry.id, name);
      } catch (error) {
        console.error('Ошибка парсинга данных перетаскивания:', error);
      }
    }
  };

  // Пустое состояние
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <FolderOutlined sx={{ fontSize: 60, color: 'action.disabled' }} />
          <Typography variant="h6">Папка пуста</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? 'По вашему запросу ничего не найдено'
              : 'Создайте папку или загрузите файлы'}
          </Typography>
          {!searchQuery && (
            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CreateNewFolder />}
                onClick={() => setCreateFolderOpen(true)}
                sx={actionButtonSx}
              >
                Создать папку
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => {
                  setSelectedFiles([]);
                  setUploadDialogOpen(true);
                }}
                sx={actionButtonSx}
              >
                Загрузить файлы
              </Button>
            </Box>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

  // Обработка ошибки
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Ошибка загрузки документов. Пожалуйста, попробуйте обновить страницу.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Заголовок и действия */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        flexDirection={{ xs: 'column', md: 'row' }}
        gap={1.5}
        mb={2}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: 32, md: 38 }, fontWeight: 800 }}>
          Документы
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<CreateNewFolder />}
            onClick={() => setCreateFolderOpen(true)}
            sx={actionButtonSx}
          >
            Создать папку
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => {
              setSelectedFiles([]);
              setUploadDialogOpen(true);
            }}
            sx={actionButtonSx}
          >
            Загрузить файлы
          </Button>
        </Box>
      </Box>

      {/* Навигация и поиск */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Box mb={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Текущая папка (можно перетащить элемент в любой сегмент пути)
          </Typography>
          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
            sx={{
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              alignItems: 'center',
            }}
          >
            {folderPath.map((folder, index) => {
              const isDragOver = dragOverFolderPathIndex === index;
              const isCurrent = index === folderPath.length - 1;
              return (
                <Button
                  key={index}
                  variant={isCurrent ? 'contained' : 'text'}
                  color={isCurrent ? 'primary' : 'inherit'}
                  onDragEnter={(e) => handlePathDragEnter(e, index)}
                  onDragLeave={handlePathDragLeave}
                  onDragOver={(e) => handlePathDragOver(e, index)}
                  onDrop={(e) => handlePathDrop(e, index)}
                  onClick={() => handleBreadcrumbClick(index)}
                  startIcon={index === 0 ? <Home fontSize="small" /> : <FolderOutlined fontSize="small" />}
                  sx={{
                    textTransform: 'none',
                    minHeight: 38,
                    borderRadius: 1,
                    px: 1.25,
                    border: isDragOver ? (theme) => `2px solid ${theme.palette.primary.main}` : undefined,
                    bgcolor: isDragOver ? (theme) => alpha(theme.palette.primary.main, 0.2) : undefined,
                    boxShadow: isDragOver ? (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
                    maxWidth: 220,
                    '& .MuiButton-startIcon': {
                      mr: 0.5,
                      color: isDragOver ? 'primary.main' : 'inherit',
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {sanitizeAndRender(folder.name)}
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Box>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Поиск файлов и папок"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.primary' }} />,
            }}
            sx={{
              width: { xs: '100%', md: 340 },
              '& input::placeholder': {
                color: 'text.primary',
                opacity: 0.75,
              },
            }}
          />
          {searchQuery && (
            <Typography variant="body2" color="text.secondary">
              Поиск в текущей папке
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Область для drag-and-drop */}
      <Box
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.items && !isDraggingInternal) {
            const hasFiles = Array.from(e.dataTransfer.items).some(
              item => item.kind === 'file'
            );
            if (hasFiles && !uploadDialogOpen) setDragOverTable(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX <= rect.left + 10 ||
            e.clientX >= rect.right - 10 ||
            e.clientY <= rect.top + 10 ||
            e.clientY >= rect.bottom - 10
          ) {
            setDragOverTable(false);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverTable(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isDraggingInternal) {
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles(files);
            setDragOverUploadDialog(false);
            setUploadDialogOpen(true);
          }
        }}
        sx={{
          position: 'relative',
          border: '2px dashed',
          borderColor: dragOverTable ? 'primary.main' : 'transparent',
          borderRadius: 2,
          transition: 'border-color 0.2s ease',
          '&:hover': {
            borderColor: dragOverTable ? '#1976d2' : 'divider',
          }
        }}
      >
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ width: 84, py: 1 }}>Превью</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSortChange('name')}
                    >
                      Имя
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 110 }}>
                    <TableSortLabel
                      active={sortField === 'size'}
                      direction={sortField === 'size' ? sortOrder : 'asc'}
                      onClick={() => handleSortChange('size')}
                    >
                      Размер
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 160 }}>
                    <TableSortLabel
                      active={sortField === 'created_at'}
                      direction={sortField === 'created_at' ? sortOrder : 'asc'}
                      onClick={() => handleSortChange('created_at')}
                    >
                      Дата создания
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 170 }}>
                    <TableSortLabel
                      active={sortField === 'created_by'}
                      direction={sortField === 'created_by' ? sortOrder : 'asc'}
                      onClick={() => handleSortChange('created_by')}
                    >
                      Кто создал
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 72, pr: 1.5 }} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: rowsPerPage }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton variant="circular" width={24} height={24} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="30%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="50%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="70%" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  : entries?.length === 0
                  ? renderEmptyState()
                  : entriesArray.map((entry) => {
                      // Пропускаем искусственные записи
                      if (entry.id?.startsWith('__')) return null;
                      const isDragging = draggedItemId === entry.id;
                      const isDragOver = dragOverItemId === entry.id;
                      return (
                        <TableRow
                          key={entry.id}
                          hover
                          draggable
                          onDragStart={(e) => handleRowDragStart(e, entry)}
                          onDragEnd={handleRowDragEnd}
                          onDragEnter={(e) => handleRowDragEnter(e, entry)}
                          onDragLeave={handleRowDragLeave}
                          onDragOver={handleRowDragOver}
                          onDrop={(e) => handleRowDrop(e, entry)}
                          sx={{
                            cursor: entry.type === 'folder' ? 'pointer' : 'default',
                            opacity: isDragging ? 0.65 : 1,
                            backgroundColor: isDragOver
                              ? (theme) => alpha(theme.palette.primary.main, 0.08)
                              : (theme) => (entriesArray.indexOf(entry) % 2 ? alpha(theme.palette.common.black, 0.02) : 'transparent'),
                            borderLeft: isDragOver
                              ? (theme) => `3px solid ${theme.palette.primary.main}`
                              : '3px solid transparent',
                            transition: 'background-color 0.15s ease, border-color 0.15s ease',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            '& > td': {
                              py: 1,
                              borderBottom: 'none',
                              lineHeight: 1.6,
                            },
                          }}
                          onClick={() => entry.type === 'folder' && handleFolderClick(entry)}
                          onDoubleClick={() => handleFileDoubleClick(entry)}
                        >
                          <TableCell>
                            <Tooltip title={entry.type === 'folder' ? 'Перетащите сюда файл или папку' : 'Файл'}>
                              <Box
                                sx={{
                                  width: 46,
                                  height: 46,
                                  borderRadius: 2.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(255,255,255,0.78)',
                                  border: '1px solid rgba(255,255,255,0.95)',
                                  boxShadow: '0 8px 18px rgba(48,69,103,0.08)',
                                  color: isDragOver ? 'primary.main' : 'inherit',
                                }}
                              >
                                {getFileIcon(entry)}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="body2"
                                fontWeight={entry.type === 'folder' ? 600 : 500}
                                sx={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: { xs: 160, sm: 280, md: 'none' },
                                  color: isDragOver && entry.type === 'folder' ? 'primary.main' : 'inherit',
                                }}
                              >
                                {sanitizeAndRender(entry.name)}
                              </Typography>
                              {entry.type === 'file' && entry.extension && (
                                <Chip
                                  label={entry.extension.replace('.', '').toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                  color="default"
                                  sx={{ fontSize: '0.68rem', height: 18, bgcolor: 'rgba(79,144,255,0.1)', border: 'none' }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {entry.type === 'folder' ? '-' : formatFileSize(entry.size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {dayjs(entry.created_at).format('DD.MM.YYYY HH:mm')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Person sx={{ fontSize: 14, color: 'text.primary' }} />
                              <Typography variant="body2" color="text.primary" sx={{ opacity: 0.85 }}>
                                {formatCreatorName(entry)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 1.5 }}>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(e, entry);
                              }}
                              sx={{
                                opacity: isDragging ? 0 : 1,
                                transition: 'opacity 0.2s',
                                visibility: isDragging ? 'hidden' : 'visible',
                                mr: 0.5,
                                p: 1,
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Пагинация */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '& .MuiTablePagination-toolbar': {
                minHeight: 56,
                alignItems: 'center',
                display: 'flex',
                gap: 1,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select': {
                fontSize: '0.95rem',
                color: 'text.primary',
                lineHeight: 1.4,
                m: 0,
              },
              '& .MuiTablePagination-select': {
                display: 'inline-flex',
                alignItems: 'center',
              },
              '& .MuiTablePagination-actions': {
                alignSelf: 'center',
                ml: 1,
              },
              '& .MuiTablePagination-actions .MuiIconButton-root': {
                p: 1,
              },
            }}
          />
        </Paper>

        {/* Контекстное меню */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {menuEntry?.type === 'file' && (
            <MenuItem onClick={handleMenuPreview}>
              <Visibility sx={{ mr: 1 }} />
              Предпросмотр
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuEdit}>
            <Edit sx={{ mr: 1 }} />
            Редактировать
          </MenuItem>
          {menuEntry?.type === 'file' && (
            <MenuItem onClick={handleMenuDownload}>
              <Download sx={{ mr: 1 }} />
              Скачать
            </MenuItem>
          )}
          {menuEntry?.type === 'folder' && (
            <MenuItem onClick={handleMenuDownloadFolder}>
              <Download sx={{ mr: 1 }} />
              Скачать папку
            </MenuItem>
          )}
          {menuEntry &&
            menuEntry.id &&
            typeof menuEntry.id === 'string' &&
            !menuEntry.id.startsWith('__') && (
              <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                Удалить
              </MenuItem>
            )}
        </Menu>

        {/* Оверлей для drag-and-drop */}
        {dragOverTable && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 15,
              pointerEvents: 'none',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'primary.main',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                py: 2,
                px: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="body1" fontWeight={600} color="primary.main">
                Отпустите файлы для загрузки
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Скрытый input для выбора файлов */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {entryToDelete?.type === 'folder'
            ? 'Удаление папки'
            : entryToDelete?.type === 'file'
              ? 'Удаление файла'
              : 'Удаление элемента'}
        </DialogTitle>
        <DialogContent>
          {entryToDelete && entryToDelete.name ? (
            <>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Вы уверены, что хотите удалить{' '}
                <strong>
                  {entryToDelete.type === 'folder' ? 'папку' : 'файл'}
                  {` "${entryToDelete.name}"`}
                </strong>
                ?
              </Typography>
              {entryToDelete.type === 'folder' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Внимание: все содержимое папки будет удалено безвозвратно.
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="error" sx={{ mt: 2 }}>
              Не удалось определить элемент для удаления. Элемент мог быть удален или перемещён.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setEntryToDelete(null);
            }}
            color="primary"
            sx={actionButtonSx}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={
              deleteDocument.isPending ||
              deleteFolder.isPending ||
              !entryToDelete ||
              !entryToDelete.id
            }
            sx={actionButtonSx}
          >
            {deleteDocument.isPending || deleteFolder.isPending ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания папки */}
      <Dialog open={createFolderOpen} onClose={() => setCreateFolderOpen(false)}>
        <DialogTitle>Создать папку</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название папки"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            error={!newFolderName.trim() && newFolderName.length > 0}
            helperText={!newFolderName.trim() && newFolderName.length > 0 ? 'Название не может быть пустым' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)} sx={actionButtonSx}>Отмена</Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim() || createFolder.isPending}
            sx={actionButtonSx}
          >
            {createFolder.isPending ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог загрузки файлов */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadTitle('');
          setUploadCaseId('');
          setSelectedCase(null);
          setCaseSearchQuery('');
          setDragOverUploadDialog(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузить файлы</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Выбранные файлы ({selectedFiles.length}):
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={`${file.name} (${formatFileSize(file.size)})`}
                      sx={{ m: 0.5 }}
                      onDelete={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              fullWidth
              label="Название для всех файлов (необязательно)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Оставьте пустым для использования имён файлов"
              helperText="Если указано, будет использовано для всех файлов"
            />
            <Autocomplete
              options={caseSuggestions || []}
              getOptionLabel={(option) => `${option.number} - ${option.case_number}`}
              value={selectedCase}
              onChange={(_, newValue) => setSelectedCase(newValue)}
              inputValue={caseSearchQuery}
              onInputChange={(_, newInputValue) => setCaseSearchQuery(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Привязать к делу (необязательно)"
                  placeholder="Начните вводить номер дела..."
                  helperText="Введите минимум 1 символ для поиска"
                />
              )}
              noOptionsText={caseSearchQuery.length === 0 ? "Введите номер дела" : "Дела не найдены"}
              sx={{ mb: 3 }}
            />
            <Box
              sx={{
                border: '2px dashed',
                borderColor: dragOverUploadDialog ? 'primary.dark' : 'primary.main',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: dragOverUploadDialog ? 'primary.lighter' : 'action.hover',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.lighter',
                },
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverUploadDialog(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  setSelectedFiles(prev => [...prev, ...files]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" fontWeight="medium" mb={1}>
                {selectedFiles.length > 0
                  ? `Добавить ещё файлов (${selectedFiles.length} выбрано)`
                  : 'Перетащите файлы сюда или нажмите для выбора'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Поддерживаются все типы файлов
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFiles([]);
              setUploadTitle('');
              setUploadCaseId('');
              setSelectedCase(null);
              setCaseSearchQuery('');
              setDragOverUploadDialog(false);
            }}
            sx={actionButtonSx}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadDocument.isPending}
            sx={actionButtonSx}
          >
            {uploadDocument.isPending ? (
              <CircularProgress size={20} />
            ) : (
              `Загрузить ${selectedFiles.length} файл(ов)`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования */}
      <EditAssetDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEntryToEdit(null);
        }}
        onSave={handleSaveEdit}
        entry={entryToEdit}
        loading={updateAsset.isPending}
      />

    </Box>
  );
}
