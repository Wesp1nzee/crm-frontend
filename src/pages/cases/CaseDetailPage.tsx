import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  LinearProgress,
  Snackbar,
  Tooltip,
  Stack,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Person,
  Business,
  Description,
  Download,
  Email,
  Phone,
  CalendarToday,
  Visibility,
  Assignment,
  Save,
  Cancel,
  ArrowBack,
  FileDownload,
  PictureAsPdf,
  InsertDriveFile,
  Folder,
  CheckCircle,
  Warning,
  Upload,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCase, usePatchCase } from '../../shared/hooks/useCases';
import { useUploadDocument, useDownloadDocument, usePreviewDocument } from '../../shared/hooks/useDocuments';
import { useDownloadCaseDocuments } from '../../shared/hooks/useCases';
import type { CaseStatus } from '../../entities/case/types';
import { useState, useEffect, useRef } from 'react';

const statusLabels: Record<CaseStatus, string> = {
  archive: 'Архив',
  in_work: 'В работе',
  debt: 'Долг',
  executed: 'Выполнено',
  withdrawn: 'Отозвано',
  cancelled: 'Отменено',
  fssp: 'ФССП',
};

const statusColors: Record<CaseStatus, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info'> = {
  archive: 'default',
  in_work: 'primary',
  debt: 'warning',
  executed: 'success',
  withdrawn: 'secondary',
  cancelled: 'error',
  fssp: 'info',
};

const statusSeverity: Record<CaseStatus, 'error' | 'info' | 'success' | 'warning'> = {
  archive: 'info',
  in_work: 'info',
  debt: 'warning',
  executed: 'success',
  withdrawn: 'info',
  cancelled: 'error',
  fssp: 'info',
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return <PictureAsPdf />;
    case 'doc':
    case 'docx':
      return <Description />;
    case 'xls':
    case 'xlsx':
      return <Description />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <Description />;
    default:
      return <InsertDriveFile />;
  }
};

const getFileTypeColor = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return 'error';
    case 'doc':
    case 'docx':
      return 'primary';
    default:
      return 'default';
  }
};

interface EditableFieldProps {
  field: string;
  value: string;
  label: string;
  editingField: string | null;
  editValues: Record<string, string>;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  multiline?: boolean;
  fullWidth?: boolean;
  type?: string;
  required?: boolean;
}

const EditableField = ({
  field,
  value,
  label,
  editingField,
  editValues,
  onEdit,
  onSave,
  onCancel,
  multiline,
  fullWidth = true,
  type = 'text',
  required = false
}: EditableFieldProps) => {
  const isEditing = editingField === field;
  const currentValue = isEditing ? (editValues[field] ?? value) : value;
  const theme = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 0.5, fontWeight: 500 }}
      >
        {label}
        {required && <Typography component="span" color="error" sx={{ ml: 0.5 }}>*</Typography>}
      </Typography>
      {isEditing ? (
        <Box
        display="flex"
        alignItems="flex-start"
        gap={1.5}
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(79, 144, 255, 0.1)'
            : 'rgba(79, 144, 255, 0.04)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(79, 144, 255, 0.3)' : 'rgba(79, 144, 255, 0.2)'}`
        }}
      >
          <TextField
            size="small"
            value={currentValue}
            onChange={(e) => onEdit(field, e.target.value)}
            multiline={multiline}
            rows={multiline ? 3 : 1}
            fullWidth={fullWidth}
            type={type}
            autoFocus
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper'
              }
            }}
          />
          <Tooltip title="Сохранить">
            <IconButton
              size="small"
              onClick={() => onSave(field)}
              color="success"
              sx={{ mt: multiline ? 1 : 0 }}
            >
              <Save fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Отменить">
            <IconButton
              size="small"
              onClick={onCancel}
              color="error"
              sx={{ mt: multiline ? 1 : 0 }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'background.default',
            minHeight: 48,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
              boxShadow: theme.shadows[1]
            }
          }}
          onClick={() => onEdit(field, value)}
        >
          <Typography
            variant="body1"
            sx={{
              flexGrow: 1,
              color: value ? 'text.primary' : 'text.disabled',
              minHeight: 24
            }}
          >
            {value || '—'}
          </Typography>
          <Tooltip title="Редактировать">
            <IconButton size="small" color="primary">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'error' | 'info' | 'success' | 'warning';
}

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: caseData, isLoading, error, refetch } = useCase(id!);
  const patchCase = usePatchCase();
  const uploadDocument = useUploadDocument();
  const downloadDocument = useDownloadDocument();
  const previewDocument = usePreviewDocument();
  const downloadCaseDocuments = useDownloadCaseDocuments();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [status, setStatus] = useState<CaseStatus>();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    if (caseData) {
      setStatus(caseData.case.status);
    }
  }, [caseData]);

  useEffect(() => {
    if (patchCase.isSuccess) {
      setNotification({
        open: true,
        message: 'Изменения успешно сохранены',
        severity: 'success'
      });
    }
  }, [patchCase.isSuccess]);

  useEffect(() => {
    if (patchCase.isError) {
      setNotification({
        open: true,
        message: 'Ошибка при сохранении изменений',
        severity: 'error'
      });
    }
  }, [patchCase.isError]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(100vh - 120px)"
        sx={{ bgcolor: 'background.default' }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} color="primary" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Загрузка дела...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !caseData) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/cases')}
            >
              К списку дел
            </Button>
          }
        >
          Дело не найдено
        </Alert>
      </Box>
    );
  }

  const { case: case_, client, assigned_experts, documents, events } = caseData;
  const isOverdue = dayjs(case_.deadline).isBefore(dayjs(), 'day');
  const isCompleted = case_.status === 'executed' || case_.status === 'archive';
  const hasCompletionDate = !!case_.completion_date;

  // Calculate payment progress
  const costNum = Number(case_.cost) || 0;
  const bankNum = Number(case_.bank_transfer_amount) || 0;
  const cashNum = Number(case_.cash_amount) || 0;
  const remainingDebtNum = Number(case_.remaining_debt) || 0;
  const totalPaid = bankNum + cashNum;
  const progressPercent = costNum > 0 ? Math.min(100, (totalPaid / costNum) * 100) : 0;

  const handleStatusUpdate = () => {
    if (status && status !== case_.status) {
      patchCase.mutate({ id: case_.id, data: { status } });
    }
  };

  const handleFieldEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  };

  const handleFieldSave = (field: string) => {
    const value = editValues[field];
    if (value !== undefined) {
      let updateData: any = { [field]: value };
      // Auto-calculate remaining debt for financial fields
      if (['cost', 'bank_transfer_amount', 'cash_amount'].includes(field)) {
        const cost = field === 'cost' ? Number(value) : costNum;
        const bankAmount = field === 'bank_transfer_amount' ? Number(value) : bankNum;
        const cashAmount = field === 'cash_amount' ? Number(value) : cashNum;
        const remainingDebt = Math.max(0, cost - bankAmount - cashAmount);
        updateData.remaining_debt = remainingDebt.toString();
      }
      patchCase.mutate({
        id: case_.id,
        data: updateData
      });
      setEditingField(null);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

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
          folder_id: null,
          case_id: case_.id,
          title: uploadTitle || file.name,
        });
      }
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadTitle('');
      refetch();
      setNotification({
        open: true,
        message: 'Файлы успешно загружены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      setNotification({
        open: true,
        message: 'Ошибка загрузки файлов',
        severity: 'error'
      });
    }
  };

  const handleDownload = (documentId: string) => {
    downloadDocument.mutate(documentId);
  };

  const handlePreview = (documentId: string) => {
    previewDocument.mutate(documentId);
  };

  return (
    <Box sx={{
      maxWidth: 1400,
      mx: 'auto',
      p: { xs: 2, sm: 3 },
      bgcolor: 'background.default',
      minHeight: 'calc(100vh - 120px)'
    }}>
      {/* Navigation Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Назад к списку дел">
            <IconButton onClick={() => navigate('/cases')} size="small">
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" color="text.secondary">
            Дела
          </Typography>
          <Typography variant="h6">/</Typography>
          <Typography variant="h6" fontWeight="bold">
            {case_.case_number}
          </Typography>
        </Box>
      </Box>

      {/* Status Banner */}
      <Alert
        severity={isOverdue && !isCompleted ? 'error' : statusSeverity[case_.status]}
        icon={isOverdue && !isCompleted ? <Warning /> : <CheckCircle />}
        sx={{
          mb: 3,
          borderRadius: 2,
          boxShadow: 2,
          '& .MuiAlert-message': {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {isOverdue && !isCompleted ? '⚠️ Срок исполнения просрочен' : statusLabels[case_.status]}
          </Typography>
          <Typography variant="body2">
            {isOverdue && !isCompleted
              ? `Срок был ${dayjs(case_.deadline).format('DD.MM.YYYY')}`
              : hasCompletionDate
                ? `Завершено: ${dayjs(case_.completion_date).format('DD.MM.YYYY')}`
                : `Срок исполнения: ${dayjs(case_.deadline).format('DD.MM.YYYY')}`
            }
          </Typography>
        </Box>
        {case_.case_type && case_.object_type && (
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 2,
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1
            }}
          >
            <Chip
              label={case_.case_type}
              size="small"
              variant="outlined"
            />
            <Chip
              label={case_.object_type}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Box>
        )}
      </Alert>

      <Grid container spacing={3}>
        {/* Main Info - Обновлено */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Case Information Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Assignment sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Основная информация
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2.5}>
                {/* Обновлены все Grid items в этой секции */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    field="number"
                    value={case_.number}
                    label="№ п/п"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <EditableField
                    field="authority"
                    value={case_.authority}
                    label="Суд/Орган"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <EditableField
                    field="object_address"
                    value={case_.object_address}
                    label="Адрес объекта"
                    editingField={editingField}
                    editValues={editValues}
                    onEdit={handleFieldEdit}
                    onSave={handleFieldSave}
                    onCancel={handleFieldCancel}
                  />
                </Grid>
                {case_.plaintiff && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EditableField
                      field="plaintiff"
                      value={case_.plaintiff}
                      label="Истец"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                    />
                  </Grid>
                )}
                {case_.defendant && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <EditableField
                      field="defendant"
                      value={case_.defendant}
                      label="Ответчик"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                    />
                  </Grid>
                )}
                {case_.remarks && (
                  <Grid size={{ xs: 12 }}>
                    <EditableField
                      field="remarks"
                      value={case_.remarks}
                      label="Примечания"
                      editingField={editingField}
                      editValues={editValues}
                      onEdit={handleFieldEdit}
                      onSave={handleFieldSave}
                      onCancel={handleFieldCancel}
                      multiline
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Client Information Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Business sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Клиент
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Box display="flex" alignItems="center" gap={2.5} mb={3} p={2} sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                  {client.type === 'legal' ? <Business fontSize="large" /> : <Person fontSize="large" />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {client.name}
                  </Typography>
                  {client.short_name && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {client.short_name}
                    </Typography>
                  )}
                  <Chip
                    label={
                      client.type === 'legal'
                        ? 'Юридическое лицо'
                        : client.type === 'individual'
                          ? 'Физическое лицо'
                          : 'Суд'
                    }
                    size="small"
                    variant="outlined"
                    color={client.type === 'legal' ? 'primary' : 'secondary'}
                  />
                </Box>
              </Box>
              <Grid container spacing={2.5}>
                {/* Обновлены все Grid items в этой секции */}
                {client.inn && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      ИНН
                    </Typography>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body1">{client.inn}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.email && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Email
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Email fontSize="small" color="action" />
                      <Typography variant="body1">{client.email}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.phone && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Телефон
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body1">{client.phone}</Typography>
                    </Box>
                  </Grid>
                )}
                {client.legal_address && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                      Юридический адрес
                    </Typography>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body1">{client.legal_address}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              {client.contacts.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                    Контактные лица
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {client.contacts.map((contact) => (
                      <ListItem
                        key={contact.id}
                        sx={{
                          px: 0,
                          py: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                            <Person fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {contact.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              {contact.position && (
                                <Typography variant="body2" color="text.secondary">
                                  {contact.position}
                                </Typography>
                              )}
                              {contact.email && (
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Email fontSize="small" color="action" />
                                  {contact.email}
                                </Typography>
                              )}
                              {contact.phone && (
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Phone fontSize="small" color="action" />
                                  {contact.phone}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        {contact.is_main && (
                          <Chip
                            label="Основной"
                            size="small"
                            color="primary"
                            variant="filled"
                            sx={{ height: 24 }}
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Description sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="bold">
                    Документы ({documents.length})
                  </Typography>
                </Box>
              }
              action={
                <Box display="flex" gap={1}>
                  <Tooltip title="Загрузить файлы">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Скачать все документы">
                    <IconButton 
                      size="small"
                      onClick={() => downloadCaseDocuments.mutate(case_.id)}
                    >
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{ pb: 0 }}
            />
              <CardContent sx={{ p: 0 }}>
                {documents.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Description sx={{ fontSize: 48, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Нет документов
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Загрузите первые документы по этому делу
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Загрузить файлы
                    </Button>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {documents.map((doc) => (
                      <ListItem
                        key={doc.id}
                        divider
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                        onDoubleClick={() => handlePreview(doc.id)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: getFileTypeColor(doc.original_filename),
                              width: 44,
                              height: 44
                            }}
                          >
                            {getFileIcon(doc.original_filename)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {doc.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {doc.original_filename} • {formatFileSize(doc.file_size)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Загружен: {dayjs(doc.created_at).format('DD.MM.YYYY HH:mm')}
                                {doc.uploaded_by && ` • ${doc.uploaded_by.full_name}`}
                              </Typography>
                              {doc.folder && (
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                                  <Folder fontSize="small" />
                                  Папка: {doc.folder.name}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Просмотр">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handlePreview(doc.id)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Скачать">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleDownload(doc.id)}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

          {/* Events Card */}
          {events.length > 0 && (
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Email sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" fontWeight="bold">
                      События ({events.length})
                    </Typography>
                  </Box>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ p: 0 }}>
                  {events.map((event) => (
                    <ListItem
                      key={event.id}
                      divider
                      sx={{
                        px: 2,
                        py: 2,
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {event.subject}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ width: '100%' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 1,
                                mb: 1.5,
                                p: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 1,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {event.body}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 1,
                                flexWrap: 'wrap'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday fontSize="small" />
                                {dayjs(event.sent_at).format('DD.MM.YYYY HH:mm')}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Email fontSize="small" />
                                {event.direction}
                              </Box>
                              {event.sender && (
                                <Box>
                                  От: {event.sender}
                                </Box>
                              )}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar - Обновлено */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Status & Dates Card */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  Статус и сроки
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ mb: 2.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Статус дела</InputLabel>
                  <Select
                    value={status || case_.status}
                    label="Статус дела"
                    onChange={(e) => setStatus(e.target.value as CaseStatus)}
                    sx={{
                      '& .MuiSelect-select': {
                        fontWeight: 'medium'
                      }
                    }}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {status && status !== case_.status && (
                  <Box mt={1.5}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={handleStatusUpdate}
                      disabled={patchCase.isPending}
                      startIcon={patchCase.isPending ? <CircularProgress size={16} /> : undefined}
                    >
                      {patchCase.isPending ? 'Сохранение...' : 'Сохранить статус'}
                    </Button>
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Дата начала
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" color="action" />
                  {dayjs(case_.start_date).format('DD.MM.YYYY')}
                </Typography>
              </Box>
              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: isOverdue && !isCompleted
                    ? (theme.palette.mode === 'dark'
                      ? 'rgba(244, 67, 54, 0.2)'
                      : 'rgba(244, 67, 54, 0.08)')
                    : 'background.default',
                  borderRadius: 1,
                  border: isOverdue && !isCompleted
                    ? `1px solid ${theme.palette.error.main}`
                    : 'none'
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  {isOverdue && !isCompleted ? 'Срок просрочен' : 'Срок исполнения'}
                </Typography>
                <Typography
                  variant="body1"
                  color={isOverdue && !isCompleted ? 'error' : 'inherit'}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CalendarToday
                    fontSize="small"
                    color={isOverdue && !isCompleted ? 'error' : 'action'}
                  />
                  {dayjs(case_.deadline).format('DD.MM.YYYY')}
                  {isOverdue && !isCompleted && (
                    <Chip
                      label={`Просрочено на ${dayjs().diff(dayjs(case_.deadline), 'day')} дн.`}
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
              {hasCompletionDate && (
                <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.08)', borderRadius: 1, border: `1px solid ${theme.palette.success.main}` }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Дата завершения
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="success" />
                    {dayjs(case_.completion_date).format('DD.MM.YYYY')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Financial Info Card - Обновлено: Убрана иконка AttachMoney */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  Финансовая информация
                </Typography>
              }
            />
            <CardContent>
              {/* Payment Progress Bar */}
              {costNum > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Оплата
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(progressPercent)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(79, 144, 255, 0.3)'
                        : 'rgba(79, 144, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: progressPercent >= 100 ? theme.palette.success.main : theme.palette.primary.main,
                        borderRadius: 5
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Оплачено: {totalPaid.toLocaleString('ru-RU')} ₽
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Всего: {costNum.toLocaleString('ru-RU')} ₽
                    </Typography>
                  </Box>
                </Box>
              )}
              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  field="cost"
                  value={case_.cost}
                  label="Стоимость дела"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  field="bank_transfer_amount"
                  value={case_.bank_transfer_amount}
                  label="Безналичная оплата"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <EditableField
                  field="cash_amount"
                  value={case_.cash_amount}
                  label="Наличная оплата"
                  editingField={editingField}
                  editValues={editValues}
                  onEdit={handleFieldEdit}
                  onSave={handleFieldSave}
                  onCancel={handleFieldCancel}
                  type="number"
                />
              </Box>
              <Box sx={{ p: 1.5, bgcolor: remainingDebtNum > 0
                ? (theme.palette.mode === 'dark'
                  ? 'rgba(244, 67, 54, 0.2)'
                  : 'rgba(244, 67, 54, 0.08)')
                : (theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(76, 175, 80, 0.08)'),
                borderRadius: 1,
                border: `1px solid ${remainingDebtNum > 0 ? theme.palette.error.main : theme.palette.success.main}`
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Остаток долга
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={remainingDebtNum > 0 ? 'error' : 'success'}
                >
                  {/* Убрана иконка <AttachMoney /> */}
                  {remainingDebtNum.toLocaleString('ru-RU')} ₽
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Assigned Experts Card */}
          {assigned_experts.length > 0 && (
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight="bold">
                    Назначенные эксперты ({assigned_experts.length})
                  </Typography>
                }
              />
              <CardContent sx={{ p: 0 }}>
                <List dense sx={{ p: 0 }}>
                  {assigned_experts.map((expert) => (
                    <ListItem
                      key={expert.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          <Person fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {expert.full_name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Email fontSize="small" color="action" />
                            {expert.email}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedFiles([]);
          setUploadTitle('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Загрузить файлы к делу</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
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
              placeholder="Оставьте пустым для использования имён файлов"
              helperText="Если указано, будет использовано для всех файлов"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFiles([]);
              setUploadTitle('');
            }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <CircularProgress size={20} />
            ) : (
              `Загрузить ${selectedFiles.length} файл(ов)`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}