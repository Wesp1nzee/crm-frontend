import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru'); 

async function enableMocking() {
  if (import.meta.env.VITE_MOCK !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  return worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});