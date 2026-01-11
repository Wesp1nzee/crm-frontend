import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Fade,
} from '@mui/material';
import { Add, TableChart } from '@mui/icons-material';
import type { CalculationCardProps } from './types';

export function CalculationCard({ 
  type, 
  tablesCount, 
  completedCount, 
  onCreateTable, 
  onShowTables 
}: CalculationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? 4 : 1,
        border: `2px solid ${isHovered ? type.color : 'transparent'}`,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${type.color}20`,
              color: type.color,
              mr: 2,
            }}
          >
            {type.icon}
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {type.title}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {type.description}
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            size="small"
            label={`${tablesCount} таблиц`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${completedCount} завершено`}
            color="success"
            variant="outlined"
          />
        </Box>
      </CardContent>

      <Fade in={isHovered} timeout={200}>
        <CardActions
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            p: 2,
          }}
        >
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => onCreateTable(type.id)}
            sx={{ bgcolor: type.color }}
          >
            Создать таблицу
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={() => onShowTables(type.id)}
          >
            Список таблиц ({tablesCount})
          </Button>
        </CardActions>
      </Fade>
    </Card>
  );
}