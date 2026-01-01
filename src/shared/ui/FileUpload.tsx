import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, AttachFile } from '@mui/icons-material';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
}

export function FileUpload({ 
  onUpload, 
  accept = '*/*', 
  multiple = true, 
  maxSize = 10 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      if (file.size > maxSize * 1024 * 1024) {
        return `Файл ${file.name} превышает максимальный размер ${maxSize}MB`;
      }
    }
    return null;
  };

  const handleFiles = async (files: File[]) => {
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    
    try {
      await onUpload(files);
    } catch (err) {
      setError('Ошибка загрузки файлов');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  return (
    <Box>
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? 'action.hover' : 'transparent',
          transition: 'all 0.2s',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Перетащите файлы сюда или нажмите для выбора
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Максимальный размер файла: {maxSize}MB
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AttachFile />}
          sx={{ mt: 2 }}
          disabled={uploading}
        >
          Выбрать файлы
        </Button>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Загрузка файлов...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}