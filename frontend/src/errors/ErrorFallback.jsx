/**
 * Reusable error fallback UI. Rendered by the root ErrorBoundary and any
 * page-level boundaries. Uses window.location (not React Router) so it
 * still works when the router itself is what crashed.
 *
 * "Go to Dashboard" targets /profile rather than /, which is the public
 * marketing page — sending a signed-in user there looks like a logout.
 * /profile is used because it's always accessible regardless of module flags.
 *
 * A chunk that failed to load gets its own copy and no "Try again": React.lazy
 * keeps the rejected import, so re-rendering fails the same way — only a
 * reload fetches the file again.
 */
import React from 'react';
import { isChunkLoadError } from './chunkReload';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const chunkError = isChunkLoadError(error);
  return (
    <div className="error-fallback" style={styles.container} role="alert">
      <h1 style={styles.title}>{chunkError ? "This page didn't load" : 'Something went wrong'}</h1>
      <p style={styles.message}>
        {chunkError
          ? 'The app was updated since this tab was opened. Reload to get the latest version.'
          : error?.message || 'An unexpected error occurred.'}
      </p>
      <div style={styles.actions}>
        <button
          type="button"
          style={chunkError ? styles.secondaryBtn : styles.primaryBtn}
          onClick={() => window.location.assign('/profile')}
        >
          Go to Dashboard
        </button>
        <button
          type="button"
          style={chunkError ? styles.primaryBtn : styles.secondaryBtn}
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
      {resetErrorBoundary && !chunkError && (
        <button
          type="button"
          style={{ ...styles.secondaryBtn, marginTop: '8px' }}
          onClick={resetErrorBoundary}
        >
          Try again
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    textAlign: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: { fontSize: '24px', fontWeight: 600, marginBottom: '8px' },
  message: { color: '#6b7280', marginBottom: '24px', maxWidth: '480px' },
  actions: { display: 'flex', gap: '12px' },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default ErrorFallback;
