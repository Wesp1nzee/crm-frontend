import React from 'react';
// Импортируем компоненты как обычно
import { Box, Typography, Button } from '@mui/material';
// Добавляем 'import type' для типов, чтобы Vite/TS удалили их при компиляции
import type { SvgIconProps } from '@mui/material'; 
import { Add, TableChart } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText: string;
  onAction: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ElementType<SvgIconProps>;
}

export function EmptyState({ 
  title, 
  description, 
  actionText, 
  onAction, 
  icon: Icon = TableChart 
}: EmptyStateProps) {
  return (
    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Icon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h5" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={onAction}
      >
        {actionText}
      </Button>
    </Box>
  );
}