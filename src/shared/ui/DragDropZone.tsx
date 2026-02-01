import { useState, useRef } from 'react';
import { Box, alpha, Fade, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { CloudUpload } from '@mui/icons-material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

const DragOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: `${pulse} 1.5s ease-in-out infinite`,
}));

const DragItem = styled(Box)(({ theme }) => ({
  opacity: 0.5,
  transform: 'rotate(5deg)',
  transition: 'all 0.2s ease-in-out',
  cursor: 'grabbing',
  '&.dragging': {
    transform: 'rotate(5deg) scale(0.9)',
    zIndex: 1000,
  },
}));

interface DragDropZoneProps {
  children: React.ReactNode;
  onDrop: (files: File[]) => void;
  onAssetDrop?: (assetId: string, assetType: 'file' | 'folder', targetFolderId: string | null) => void;
  accept?: string;
  disabled?: boolean;
}

export function DragDropZone({ 
  children, 
  onDrop, 
  onAssetDrop,
  accept = '*',
  disabled = false 
}: DragDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [draggedAsset, setDraggedAsset] = useState<{
    id: string;
    type: 'file' | 'folder';
  } | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragOver(false);
    dragCounter.current = 0;

    // Проверяем, перетаскиваем ли мы внутренний элемент
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData && onAssetDrop) {
      try {
        const { id, type } = JSON.parse(assetData);
        onAssetDrop(id, type, null); // null означает перемещение в корень
        return;
      } catch (error) {
        console.error('Ошибка парсинга данных перетаскивания:', error);
      }
    }

    // Обрабатываем файлы
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onDrop(files);
    }
  };

  return (
    <Box
      sx={{ position: 'relative', minHeight: '200px' }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      <Fade in={dragOver}>
        <DragOverlay>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="primary">
            Отпустите для загрузки файлов
          </Typography>
          <Typography variant="body2" color="text.secondary">
            или для перемещения элементов
          </Typography>
        </DragOverlay>
      </Fade>
    </Box>
  );
}

interface DraggableItemProps {
  children: React.ReactNode;
  assetId: string;
  assetType: 'file' | 'folder';
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableItem({ 
  children, 
  assetId, 
  assetType, 
  onDragStart, 
  onDragEnd 
}: DraggableItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: assetId,
      type: assetType,
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <DragItem
      draggable
      className={isDragging ? 'dragging' : ''}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg) scale(0.9)' : 'none',
      }}
    >
      {children}
    </DragItem>
  );
}

interface DropTargetProps {
  children: React.ReactNode;
  folderId: string | null;
  onAssetDrop: (assetId: string, assetType: 'file' | 'folder', targetFolderId: string | null) => void;
  disabled?: boolean;
}

export function DropTarget({ children, folderId, onAssetDrop, disabled }: DropTargetProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const assetData = e.dataTransfer.getData('application/json');
    if (assetData) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setDragOver(false);

    const assetData = e.dataTransfer.getData('application/json');
    if (assetData) {
      try {
        const { id, type } = JSON.parse(assetData);
        onAssetDrop(id, type, folderId);
      } catch (error) {
        console.error('Ошибка парсинга данных перетаскивания:', error);
      }
    }
  };

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        backgroundColor: dragOver ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
        border: dragOver ? (theme) => `2px dashed ${theme.palette.primary.main}` : '2px dashed transparent',
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {children}
    </Box>
  );
}