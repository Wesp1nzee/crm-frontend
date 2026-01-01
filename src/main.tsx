import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

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