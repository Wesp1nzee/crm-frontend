import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete,
  Download,
  Visibility,
  Add,
  FilterList,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useDocuments, useUploadDocument, useDeleteDocument, useCases } from '../../shared/hooks/useCases';
import { FileUpload } from '../../shared/ui/FileUpload';
import type { Document } from '../../entities/case/types';

const documentTypeLabels: Record<Document['type'], string> = {
  contract: 'Договор',
  report: 'Отчет',
  photo: 'Фото',
  certificate: 'Сертификат',
  other: 'Прочее',
};

const documentTypeColors: Record<Document['type'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  contract: 'primary',
  report: 'success',
  photo: 'info',
  certificate: 'warning',
  other: 'default',
};

export function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<Document['type'] | 'all'>('all');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [uploadType, setUploadType] = useState<Document['type']>('other');
  const [uploadCaseId, setUploadCaseId] = useState<string>('');

  const { data: documents, isLoading, error } = useDocuments();
  const { data: cases } = useCases();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const filteredDocuments = documents?.filter(doc => {
    const typeMatch = filterType === 'all' || doc.type === filterType;
    const caseMatch = filterCase === 'all' || doc.caseId === filterCase;
    return typeMatch && caseMatch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);
      if (uploadCaseId) {
        formData.append('caseId', uploadCaseId);
      }
      await uploadDocument.mutateAsync(formData);
    }
    setUploadDialogOpen(false);
    setUploadType('other');
    setUploadCaseId('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить документ?')) {
      deleteDocument.mutate(id);
    }
  };

  const getCaseName = (caseId?: string) => {
    if (!caseId) return '-';
    const case_ = cases?.find(c => c.id === caseId);
    return case_?.caseNumber || caseId;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки документов
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Документы
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Загрузить документы
        </Button>
      </Box>

      {/* Фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FilterList />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Тип документа</InputLabel>
            <Select
              value={filterType}
              label="Тип документа"
              onChange={(e) => setFilterType(e.target.value as Document['type'] | 'all')}
            >
              <MenuItem value="all">Все типы</MenuItem>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Дело</InputLabel>
            <Select
              value={filterCase}
              label="Дело"
              onChange={(e) => setFilterCase(e.target.value)}
            >
              <MenuItem value="all">Все дела</MenuItem>
              {cases?.map((case_) => (
                <MenuItem key={case_.id} value={case_.id}>
                  {case_.caseNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Таблица документов */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Размер</TableCell>
              <TableCell>Дело</TableCell>
              <TableCell>Загружен</TableCell>
              <TableCell>Автор</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments?.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {doc.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={documentTypeLabels[doc.type]}
                    color={documentTypeColors[doc.type]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatFileSize(doc.size)}</TableCell>
                <TableCell>{getCaseName(doc.caseId)}</TableCell>
                <TableCell>
                  {dayjs(doc.uploadedAt).format('DD.MM.YYYY HH:mm')}
                </TableCell>
                <TableCell>{doc.uploadedBy}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton size="small" title="Просмотр">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" title="Скачать">
                      <Download />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      title="Удалить"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог загрузки */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Загрузить документы</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Box display="flex" gap={2} mb={3}>
              <FormControl fullWidth>
                <InputLabel>Тип документа</InputLabel>
                <Select
                  value={uploadType}
                  label="Тип документа"
                  onChange={(e) => setUploadType(e.target.value as Document['type'])}
                >
                  {Object.entries(documentTypeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Дело (необязательно)</InputLabel>
                <Select
                  value={uploadCaseId}
                  label="Дело (необязательно)"
                  onChange={(e) => setUploadCaseId(e.target.value)}
                >
                  <MenuItem value="">Без привязки к делу</MenuItem>
                  {cases?.map((case_) => (
                    <MenuItem key={case_.id} value={case_.id}>
                      {case_.caseNumber} - {case_.objectAddress}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip,.rar"
              maxSize={50}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Отмена
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}