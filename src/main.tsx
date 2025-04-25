import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CallProvider } from './contexts/CallContext.tsx';
import { TwilioProvider } from './contexts/TwilioContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TwilioProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </TwilioProvider>
  </StrictMode>
);