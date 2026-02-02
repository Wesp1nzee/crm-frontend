import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { HelmetProvider } from 'react-helmet-async';
dayjs.locale('ru');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);