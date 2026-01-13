import leiferData from '../data/g.json';

export interface LeiferCorrection {
  correctionName: string;
  region: string;
  fund: string;
  targetValue: string;
  analogueValue: string;
}

export function getLeiferCoefficient(
  correctionName: string,
  region: string,
  fund: string,
  targetValue: string,
  analogueValue: string
): number {
  try {
    const corrections = leiferData.reference_books["Лейфер 2024 Квартиры"].corrections;
    const correction = corrections[correctionName];
    
    if (!correction) return 1.0;
    
    const regions = correction.regions;
    if (!regions[region]) return 1.0;
    
    const regionData = regions[region];
    const fundKey = Object.keys(regionData).find(key => key.includes(fund));
    
    if (!fundKey) return 1.0;
    
    const matrix = regionData[fundKey];
    if (!matrix[targetValue] || !matrix[targetValue][analogueValue]) return 1.0;
    
    return matrix[targetValue][analogueValue];
  } catch {
    return 1.0;
  }
}

export const REGIONS = [
  'Москва',
  'Санкт-Петербург',
  'Курортные регионы',
  'Города с населением более 1 млн. чел. (кроме г. Москва и г. Санкт-Петербург)',
  'Города с населением 500-1000 тыс. чел.',
  'Города с населением до 500 тыс. чел.',
  'Московская область',
  'Усреднённые по России'
];

export const FUNDS = [
  '1. Старый фонд',
  '2. Массовое жилье советской постройки',
  '3. Массовое современное жилье',
  '4. Жилье повышенной комфортности Соответсвенно'
];

export const WALL_MATERIALS = [
  'кирпичные стены',
  'монолитные стены',
  'панельные стены',
  'шлакоблочные стены',
  'деревянные стены'
];

export const FLOORS = [
  'первый этаж',
  'средний этаж',
  'последний этаж'
];

export const BALCONY_OPTIONS = [
  'есть',
  'нет'
];

export const LOCATIONS = [
  'Культурный и исторический центр',
  'Центры деловой активности, зоны точечной застройки',
  'Спальные микрорайоны современной высотной застройки, жилые кварталы',
  'Спальные микрорайоны среднестажной застройки',
  'Окраины городов, промзоны'
];