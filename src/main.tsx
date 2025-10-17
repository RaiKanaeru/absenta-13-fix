import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FontSizeProvider } from './contexts/FontSizeContext'
import { initSentry } from './config/sentry'
import ErrorBoundary from './components/ErrorBoundary'

// Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <FontSizeProvider>
      <App />
    </FontSizeProvider>
  </ErrorBoundary>
);
