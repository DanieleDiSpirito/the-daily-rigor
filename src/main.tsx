import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './vendor/katex.css';
import './index.css';
import App from './App';
import { startClock, syncClock } from './lib/clock';

// Learn the server's date before the first paint, so a wrong device clock never flashes the wrong day.
syncClock().finally(() => {
  startClock();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
