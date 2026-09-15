import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './errors/ErrorBoundary.jsx';
import { initSentry, installGlobalHandlers } from './utils/sentry.js';
import './index.css';

// Installed before render so an error thrown during the first mount — or in a
// promise nothing is awaiting — is still captured. Cheap and synchronous; the
// Sentry SDK itself still loads after paint.
installGlobalHandlers();

// react-toastify ships in its own chunk; toasts keep working as soon as it
// arrives and nothing in the shell toasts during the first paint anyway.
const ToastHost = lazy(() => import('./components/ToastHost.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
      <Suspense fallback={null}>
        <ToastHost />
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>,
);

// Load the error-monitoring SDK after mount — it must not block first paint.
initSentry();
