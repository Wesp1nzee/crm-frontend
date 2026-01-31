import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

// Просто запускаем приложение без моков
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);