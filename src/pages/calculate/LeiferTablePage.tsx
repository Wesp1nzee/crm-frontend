import { useState, useCallback, memo } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';

interface LeiferRow {
  id: string;
  name: string;
  values: string[];
  type: 'header' | 'input' | 'calculated' | 'result';
  isEditable?: boolean;
  colSpan?: number;
}

// Метаданные для выбора
const REGIONS = [
  'Курортные регионы',
  'Москва',
  'Санкт-Петербург',
  'Города с населением более 1 млн. чел. (кроме г. Москва и г. Санкт-Петербург)',
  'Города с населением 500-1000 тыс. чел.',
  'Города с населением до 500 тыс. чел.',
  'Московская область',
  'Усреднённые по России'
];

const HOUSING_TYPES = [
  'Старый фонд',
  'Массовое жилье советской постройки',
  'Массовое современное жилье',
  'Жилье повышенной комфортности'
];

const WALL_MATERIALS = [
  'кирпичные стены',
  'шлакоблочные стены',
  'деревянные стены',
  'монолитные стены',
  'панельные стены'
];

const LOCATIONS = [
  'Культурный и исторический центр',
  'Центры деловой активности, зоны точечной застройки',
  'Спальные микрорайоны современной высотной застройки, жилые кварталы',
  'Спальные микрорайоны среднестажной застройки',
  'Окраины городов, промзоны'
];

const BALCONY_OPTIONS = ['есть', 'нет'];

const FLOOR_OPTIONS = [
  'средний этаж',
  'последний этаж',
  'первый этаж'
];

const HOUSE_CONDITIONS = [
  'хорошее',
  'удовл.',
  'неудовл.',
  'дом, введенный в эксплуатацию',
  'дом на стадии строительства',
  'дом на этапе котлована'
];

const APARTMENT_CONDITIONS = [
  'комфортный ремонт (отделка «премиум»)',
  'типовой ремонт (отделка «стандарт»)',
  'требует косметического ремонта (в т.ч. под чистовую отделку)',
  'требует капитального ремонта (в т.ч. без отделки)'
];

// Стили для Select
const selectStyle = {
  '& .MuiSelect-select': {
    minWidth: 150,
    overflow: 'visible',
    whiteSpace: 'nowrap',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    overflow: 'visible',
  },
};

const menuProps = {
  PaperProps: {
    style: {
      maxHeight: 48 * 4.5,
      width: 'auto',
      minWidth: 200,
    },
  },
};

const LeiferTableContent = memo(({ rows, onValueChange }: { rows: LeiferRow[], onValueChange: (rowId: string, colIndex: number, value: string) => void }) => {
  return (
    <TableContainer component={Paper} elevation={3}>
      <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell 
              sx={{ 
                fontWeight: 'bold', 
                bgcolor: 'grey.100',
                borderRight: 1, 
                borderColor: 'divider'
              }}
            >
              Наименование показателя
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 'bold', 
                bgcolor: 'grey.100', 
                textAlign: 'center',
                borderRight: 1, 
                borderColor: 'divider'
              }}
            >
              №1
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 'bold', 
                bgcolor: 'grey.100', 
                textAlign: 'center',
                borderRight: 1, 
                borderColor: 'divider'
              }}
            >
              №2
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 'bold', 
                bgcolor: 'grey.100', 
                textAlign: 'center'
              }}
            >
              №3
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={{ 
              bgcolor: row.type === 'header' ? 'grey.100' : 
                      row.type === 'result' ? 'grey.50' : 'inherit',
              '&:hover': { bgcolor: 'action.hover' }
            }}>
              <TableCell 
                sx={{ 
                  fontWeight: row.type === 'header' ? 'bold' : 'normal',
                  borderRight: 1, 
                  borderColor: 'divider'
                }}
              >
                {row.name}
              </TableCell>
              
              {/* Для строк, которые должны занимать все 3 столбца */}
              {row.colSpan ? (
                <TableCell 
                  colSpan={row.colSpan} 
                  sx={{ 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderRight: 1, 
                    borderColor: 'divider'
                  }}
                >
                  {row.values[0]}
                </TableCell>
              ) : (
                // Для обычных строк - отображаем значения по столбцам
                row.values.map((value, colIndex, arr) => (
                  <TableCell 
                    key={`cell-${row.id}-${colIndex}`} 
                    sx={{ 
                      textAlign: 'center',
                      fontWeight: row.type === 'calculated' || row.type === 'result' ? 'bold' : 'normal',
                      borderRight: colIndex < arr.length - 1 ? 1 : 0, 
                      borderColor: 'divider'
                    }}
                  >
                    {row.isEditable ? (
                      <TextField
                        size="small"
                        value={value}
                        onChange={(e) => onValueChange(row.id, colIndex, e.target.value)}
                        inputProps={{
                          style: { textAlign: 'center' }
                        }}
                        sx={{
                          width: '80px',
                          '& .MuiInputBase-input': {
                            padding: '4px 8px'
                          }
                        }}
                      />
                    ) : (
                      value
                    )}
                  </TableCell>
                ))
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export function LeiferTablePage() {
  const [objectMetadata, setObjectMetadata] = useState({
    region: '',
    housingType: '',
    wallMaterial: '',
    location: '',
    balcony: '',
    floor: '',
    houseCondition: '',
    apartmentCondition: ''
  });

  const [analogsMetadata, setAnalogsMetadata] = useState([
    { wallMaterial: '', location: '', balcony: '', floor: '', houseCondition: '', apartmentCondition: '' },
    { wallMaterial: '', location: '', balcony: '', floor: '', houseCondition: '', apartmentCondition: '' },
    { wallMaterial: '', location: '', balcony: '', floor: '', houseCondition: '', apartmentCondition: '' }
  ]);

  const [rows, setRows] = useState<LeiferRow[]>([
    {
      id: 'price',
      name: 'Цена предложения, тыс. руб.',
      values: ['9000', '7800', '10500'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'area',
      name: 'Площадь, м²',
      values: ['54', '53.1', '60'],
      type: 'input',
      isEditable: true,
    },
    // Расчетные строки
    {
      id: 'costPerMeter',
      name: 'Стоимость одного метра общей площади квартиры, тыс.руб.',
      values: ['166.667', '146.893', '175.000'],
      type: 'calculated',
    },
    {
      id: 'rightsCorrection',
      name: 'Корректировка на права, передаваемые на квартиру',
      values: ['1', '1', '1'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost1',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['166.667', '146.893', '175.000'],
      type: 'calculated',
    },
    {
      id: 'financeCorrection',
      name: 'Корректировка на финансовые условия',
      values: ['1', '1', '1'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost2',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['166.667', '146.893', '175.000'],
      type: 'calculated',
    },
    {
      id: 'dateCorrection',
      name: 'Корректировка на дату продажи',
      values: ['1', '1', '1'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost3',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['166.667', '146.893', '175.000'],
      type: 'calculated',
    },
    {
      id: 'tradeCorrection',
      name: 'Корректировка на торг',
      values: ['0.923', '0.923', '0.923'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost4',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['153.833', '135.582', '161.525'],
      type: 'calculated',
    },
    {
      id: 'locationCorrection',
      name: 'Корректировка на местоположение',
      values: ['0.800', '0.800', '0.800'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost5',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['123.067', '108.466', '129.220'],
      type: 'calculated',
    },
    {
      id: 'areaCorrection',
      name: 'Корректировка на площадь квартиры',
      values: ['1.012', '1.010', '1.021'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost6',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['124.523', '109.600', '131.870'],
      type: 'calculated',
    },
    {
      id: 'materialCorrection',
      name: 'Корректировка на материал стен дома',
      values: ['0.74', '0.74', '0.74'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost7',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['92.147', '81.104', '97.584'],
      type: 'calculated',
    },
    {
      id: 'communicationCorrection',
      name: 'Корректировка на обеспечение инженерными коммуникациями',
      values: ['1', '1', '1'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost8',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['92.147', '81.104', '97.584'],
      type: 'calculated',
    },
    {
      id: 'conditionCorrection',
      name: 'Корректировка на техническое состояние дома',
      values: ['0.72', '0.72', '0.72'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost9',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['66.346', '58.395', '70.260'],
      type: 'calculated',
    },
    {
      id: 'floorCorrection',
      name: 'Корректировка на этажность',
      values: ['0.97', '0.97', '0.97'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost10',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['64.355', '56.643', '68.152'],
      type: 'calculated',
    },
    {
      id: 'apartmentConditionCorrection',
      name: 'Корректировка на техническое состояние квартиры',
      values: ['1.00', '1.00', '1.00'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost11',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['64.355', '56.643', '68.152'],
      type: 'calculated',
    },
    {
      id: 'balconyCorrection',
      name: 'Корректировка на наличие лоджии (балкона)',
      values: ['0.920', '0.920', '0.920'],
      type: 'input',
      isEditable: true,
    },
    {
      id: 'correctedCost12',
      name: 'Приведенная стоимость 1м², тыс. руб.',
      values: ['59.207', '52.111', '62.700'],
      type: 'calculated',
    },
    {
      id: 'count',
      name: 'Количество единиц',
      values: ['6', '5', '5'],
      type: 'input',
      isEditable: true,
    },
    // Эти строки должны занимать все 3 столбца
    {
      id: 'weight',
      name: 'Вес, присвоенный аналогу',
      values: ['0', '0', '0'],
      type: 'result',
      colSpan: 3, // Занимает 3 столбца
    },
    {
      id: 'averageCost',
      name: 'Средняя откорректированная стоимость 1 м², тыс. руб.',
      values: ['58.081'],
      type: 'result',
      colSpan: 3, // Занимает 3 столбца
    },
    {
      id: 'evaluatedArea',
      name: 'Площадь оцениваемой квартиры, м²',
      values: ['46.7'],
      type: 'input',
      colSpan: 3, // Занимает 3 столбца
    },
    {
      id: 'totalCost',
      name: 'Стоимость оцениваемой квартиры, руб.',
      values: ['2712.397'],
      type: 'result',
      colSpan: 3, // Занимает 3 столбца
    },
  ]);

  const handleValueChange = useCallback((rowId: string, colIndex: number, value: string) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.id === rowId) {
          const newValues = [...row.values];
          newValues[colIndex] = value;
          return { ...row, values: newValues };
        }
        return row;
      })
    );
  }, []);

  const handleObjectMetadataChange = useCallback((field: string, value: string) => {
    setObjectMetadata(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAnalogMetadataChange = useCallback((analogIndex: number, field: string, value: string) => {
    setAnalogsMetadata(prev => 
      prev.map((analog, index) => 
        index === analogIndex ? { ...analog, [field]: value } : analog
      )
    );
  }, []);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Таблица Лейфера
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Объект оценки
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Регион</InputLabel>
                <Select
                  value={objectMetadata.region}
                  label="Регион"
                  onChange={(e) => handleObjectMetadataChange('region', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {REGIONS.map(region => (
                    <MenuItem key={region} value={region} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Тип жилья</InputLabel>
                <Select
                  value={objectMetadata.housingType}
                  label="Тип жилья"
                  onChange={(e) => handleObjectMetadataChange('housingType', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {HOUSING_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Материал стен</InputLabel>
                <Select
                  value={objectMetadata.wallMaterial}
                  label="Материал стен"
                  onChange={(e) => handleObjectMetadataChange('wallMaterial', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {WALL_MATERIALS.map(material => (
                    <MenuItem key={material} value={material} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {material}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Местоположение</InputLabel>
                <Select
                  value={objectMetadata.location}
                  label="Местоположение"
                  onChange={(e) => handleObjectMetadataChange('location', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {LOCATIONS.map(location => (
                    <MenuItem key={location} value={location} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Лоджия/балкон</InputLabel>
                <Select
                  value={objectMetadata.balcony}
                  label="Лоджия/балкон"
                  onChange={(e) => handleObjectMetadataChange('balcony', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {BALCONY_OPTIONS.map(option => (
                    <MenuItem key={option} value={option} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Этажность</InputLabel>
                <Select
                  value={objectMetadata.floor}
                  label="Этажность"
                  onChange={(e) => handleObjectMetadataChange('floor', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {FLOOR_OPTIONS.map(floor => (
                    <MenuItem key={floor} value={floor} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {floor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Состояние дома</InputLabel>
                <Select
                  value={objectMetadata.houseCondition}
                  label="Состояние дома"
                  onChange={(e) => handleObjectMetadataChange('houseCondition', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {HOUSE_CONDITIONS.map(condition => (
                    <MenuItem key={condition} value={condition} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Состояние квартиры</InputLabel>
                <Select
                  value={objectMetadata.apartmentCondition}
                  label="Состояние квартиры"
                  onChange={(e) => handleObjectMetadataChange('apartmentCondition', e.target.value)}
                  MenuProps={menuProps}
                  sx={selectStyle}
                >
                  {APARTMENT_CONDITIONS.map(condition => (
                    <MenuItem key={condition} value={condition} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Метаданные аналогов */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="secondary">
            Аналоги
          </Typography>
          {analogsMetadata.map((analog, analogIndex) => (
            <Box key={analogIndex} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Аналог №{analogIndex + 1}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Материал стен</InputLabel>
                    <Select
                      value={analog.wallMaterial}
                      label="Материал стен"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'wallMaterial', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {WALL_MATERIALS.map(material => (
                        <MenuItem key={material} value={material} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {material}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Местоположение</InputLabel>
                    <Select
                      value={analog.location}
                      label="Местоположение"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'location', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {LOCATIONS.map(location => (
                        <MenuItem key={location} value={location} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Лоджия/балкон</InputLabel>
                    <Select
                      value={analog.balcony}
                      label="Лоджия/балкон"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'balcony', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {BALCONY_OPTIONS.map(option => (
                        <MenuItem key={option} value={option} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Этажность</InputLabel>
                    <Select
                      value={analog.floor}
                      label="Этажность"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'floor', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {FLOOR_OPTIONS.map(floor => (
                        <MenuItem key={floor} value={floor} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {floor}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Состояние дома</InputLabel>
                    <Select
                      value={analog.houseCondition}
                      label="Состояние дома"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'houseCondition', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {HOUSE_CONDITIONS.map(condition => (
                        <MenuItem key={condition} value={condition} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {condition}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Состояние квартиры</InputLabel>
                    <Select
                      value={analog.apartmentCondition}
                      label="Состояние квартиры"
                      onChange={(e) => handleAnalogMetadataChange(analogIndex, 'apartmentCondition', e.target.value)}
                      MenuProps={menuProps}
                      sx={selectStyle}
                    >
                      {APARTMENT_CONDITIONS.map(condition => (
                        <MenuItem key={condition} value={condition} sx={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                          {condition}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              {analogIndex < analogsMetadata.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </CardContent>
      </Card>
      <LeiferTableContent rows={rows} onValueChange={handleValueChange} />
    </Box>
  );
}