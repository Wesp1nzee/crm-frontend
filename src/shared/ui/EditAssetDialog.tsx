import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Box,
} from '@mui/material';
import type { FileSystemEntry } from '../../entities/document/types';
import type { CaseSuggestion } from '../../entities/case/types';
import { useCaseSuggestions } from '../hooks/useDocuments';

interface EditAssetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name?: string;
    title?: string;
    case_id?: string | null;
  }) => void;
  entry: FileSystemEntry | null;
  loading?: boolean;
}

export function EditAssetDialog({ open, onClose, onSave, entry, loading }: EditAssetDialogProps) {
  const [name, setName] = useState('');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseSuggestion | null>(null);

  const { data: caseSuggestions } = useCaseSuggestions(caseSearchQuery);

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setCaseSearchQuery('');
      setSelectedCase(null);
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;

    const data: any = {};
    
    if (entry.type === 'folder') {
      data.name = name.trim();
    } else {
      data.title = name.trim();
    }
    
    if (selectedCase) {
      data.case_id = selectedCase.id;
    }

    onSave(data);
  };

  const handleClose = () => {
    setName('');
    setCaseSearchQuery('');
    setSelectedCase(null);
    onClose();
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Редактировать {entry.type === 'folder' ? 'папку' : 'файл'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={entry.type === 'folder' ? 'Название папки' : 'Название файла'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
          
          <Autocomplete
            options={caseSuggestions || []}
            getOptionLabel={(option) => `${option.case_number} - ${option.authority}`}
            value={selectedCase}
            onChange={(_, newValue) => setSelectedCase(newValue)}
            inputValue={caseSearchQuery}
            onInputChange={(_, newInputValue) => setCaseSearchQuery(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Привязать к делу (необязательно)"
                placeholder="Начните вводить номер дела..."
              />
            )}
            noOptionsText="Дела не найдены"
            clearOnBlur={false}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!name.trim() || loading}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}