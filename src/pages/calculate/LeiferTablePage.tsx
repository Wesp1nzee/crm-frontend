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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  getLeiferCoefficient,
  REGIONS,
  FUNDS,
  WALL_MATERIALS,
  FLOORS,
  BALCONY_OPTIONS,
  LOCATIONS,
} from '../../shared/utils/leifer';

interface Analogue {
  id: string;
  name: string;
  price: number;
  params: Record<string, string>;
}

interface TargetObject {
  region: string;
  fund: string;
  wallMaterial: string;
  floor: string;
  balcony: string;
  location: string;
}

export function LeiferTablePage() {
  const [target, setTarget] = useState<TargetObject>({
    region: 'Москва',
    fund: '3. Массовое современное жилье',
    wallMaterial: 'кирпичные стены',
    floor: 'средний этаж',
    balcony: 'есть',
    location: 'Культурный и исторический центр',
  });

  const [analogues, setAnalogues] = useState<Analogue[]>([
    {
      id: '1',
      name: 'Аналог 1',
      price: 15000000,
      params: {
        wallMaterial: 'панельные стены',
        floor: 'первый этаж',
        balcony: 'нет',
        location: 'Спальные микрорайоны современной высотной застройки, жилые кварталы',
      },
    },
  ]);

  const addAnalogue = () => {
    const newId = (analogues.length + 1).toString();
    setAnalogues([
      ...analogues,
      {
        id: newId,
        name: `Аналог ${newId}`,
        price: 0,
        params: {
          wallMaterial: 'кирпичные стены',
          floor: 'средний этаж',
          balcony: 'есть',
          location: 'Культурный и исторический центр',
        },
      },
    ]);
  };

  const updateAnalogue = (id: string, field: string, value: string | number) => {
    setAnalogues(analogues.map(a => 
      a.id === id 
        ? field === 'price' || field === 'name'
          ? { ...a, [field]: value }
          : { ...a, params: { ...a.params, [field]: value } }
        : a
    ));
  };

  const getCoefficient = (correctionName: string, analogueValue: string) => {
    const targetValue = correctionName === 'Корректировка на материал стен дома' ? target.wallMaterial
      : correctionName === 'Корректировка на этажность' ? target.floor
      : correctionName === 'Корректировка на наличие лоджии (балкона)' ? target.balcony
      : correctionName === 'Корректировка на местоположение' ? target.location
      : '';

    return getLeiferCoefficient(correctionName, target.region, target.fund, targetValue, analogueValue);
  };

  const calculateCorrectedPrice = (analogue: Analogue) => {
    const wallCoef = getCoefficient('Корректировка на материал стен дома', analogue.params.wallMaterial);
    const floorCoef = getCoefficient('Корректировка на этажность', analogue.params.floor);
    const balconyCoef = getCoefficient('Корректировка на наличие лоджии (балкона)', analogue.params.balcony);
    const locationCoef = getCoefficient('Корректировка на местоположение', analogue.params.location);
    
    return analogue.price * 0.95 * wallCoef * floorCoef * balconyCoef * locationCoef;
  };

  const averagePrice = analogues.length > 0 
    ? analogues.reduce((sum, a) => sum + calculateCorrectedPrice(a), 0) / analogues.length 
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Оценка по методике Лейфера 2024
      </Typography>

      {/* Target Object Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Объект оценки
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Регион</InputLabel>
            <Select
              value={target.region}
              label="Регион"
              onChange={(e) => setTarget({ ...target, region: e.target.value })}
            >
              {REGIONS.map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Фонд</InputLabel>
            <Select
              value={target.fund}
              label="Фонд"
              onChange={(e) => setTarget({ ...target, fund: e.target.value })}
            >
              {FUNDS.map(fund => (
                <MenuItem key={fund} value={fund}>{fund}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Материал стен</InputLabel>
            <Select
              value={target.wallMaterial}
              label="Материал стен"
              onChange={(e) => setTarget({ ...target, wallMaterial: e.target.value })}
            >
              {WALL_MATERIALS.map(material => (
                <MenuItem key={material} value={material}>{material}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Этаж</InputLabel>
            <Select
              value={target.floor}
              label="Этаж"
              onChange={(e) => setTarget({ ...target, floor: e.target.value })}
            >
              {FLOORS.map(floor => (
                <MenuItem key={floor} value={floor}>{floor}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Балкон</InputLabel>
            <Select
              value={target.balcony}
              label="Балкон"
              onChange={(e) => setTarget({ ...target, balcony: e.target.value })}
            >
              {BALCONY_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Местоположение</InputLabel>
            <Select
              value={target.location}
              label="Местоположение"
              onChange={(e) => setTarget({ ...target, location: e.target.value })}
            >
              {LOCATIONS.map(location => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Analogues Table */}
      <Paper>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Аналоги</Typography>
          <Button startIcon={<Add />} onClick={addAnalogue}>
            Добавить аналог
          </Button>
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>№</TableCell>
                <TableCell>Наименование</TableCell>
                <TableCell>Цена (руб)</TableCell>
                <TableCell>Корректировка на торг</TableCell>
                <TableCell>Этаж</TableCell>
                <TableCell>Материал стен</TableCell>
                <TableCell>Наличие балкона</TableCell>
                <TableCell>Местоположение</TableCell>
                <TableCell>Скорректированная цена</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analogues.map((analogue, index) => {
                const wallCoef = getCoefficient('Корректировка на материал стен дома', analogue.params.wallMaterial);
                const floorCoef = getCoefficient('Корректировка на этажность', analogue.params.floor);
                const balconyCoef = getCoefficient('Корректировка на наличие лоджии (балкона)', analogue.params.balcony);
                const locationCoef = getCoefficient('Корректировка на местоположение', analogue.params.location);
                const correctedPrice = calculateCorrectedPrice(analogue);

                return (
                  <TableRow key={analogue.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={analogue.name}
                        onChange={(e) => updateAnalogue(analogue.id, 'name', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={analogue.price}
                        onChange={(e) => updateAnalogue(analogue.id, 'price', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="0.95" size="small" />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={analogue.params.floor}
                          onChange={(e) => updateAnalogue(analogue.id, 'floor', e.target.value)}
                        >
                          {FLOORS.map(floor => (
                            <MenuItem key={floor} value={floor}>{floor}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip 
                        label={floorCoef.toFixed(2)} 
                        size="small" 
                        color={floorCoef !== 1 ? 'primary' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={analogue.params.wallMaterial}
                          onChange={(e) => updateAnalogue(analogue.id, 'wallMaterial', e.target.value)}
                        >
                          {WALL_MATERIALS.map(material => (
                            <MenuItem key={material} value={material}>{material}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip 
                        label={wallCoef.toFixed(2)} 
                        size="small" 
                        color={wallCoef !== 1 ? 'primary' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={analogue.params.balcony}
                          onChange={(e) => updateAnalogue(analogue.id, 'balcony', e.target.value)}
                        >
                          {BALCONY_OPTIONS.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip 
                        label={balconyCoef.toFixed(2)} 
                        size="small" 
                        color={balconyCoef !== 1 ? 'primary' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={analogue.params.location}
                          onChange={(e) => updateAnalogue(analogue.id, 'location', e.target.value)}
                        >
                          {LOCATIONS.map(location => (
                            <MenuItem key={location} value={location}>{location}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Chip 
                        label={locationCoef.toFixed(2)} 
                        size="small" 
                        color={locationCoef !== 1 ? 'primary' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {correctedPrice.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Summary Row */}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={8}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Среднее значение по аналогам
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {averagePrice.toLocaleString('ru-RU')} ₽
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}