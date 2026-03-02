import './index.css';
import AppRouter from './router/index';
import { Toaster } from 'react-hot-toast';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: 'var(--accent-green)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--danger)', secondary: '#fff' } },
      }}
    />
  </StrictMode>
);
