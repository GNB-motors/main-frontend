/**
 * Reusable error fallback UI. Rendered by the root ErrorBoundary and any
 * page-level boundaries. Uses window.location (not React Router) so it
 * still works when the router itself is what crashed.
 */
import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (
        <div className="error-fallback" style={styles.container} role="alert">
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
                {error?.message || 'An unexpected error occurred.'}
            </p>
            <div style={styles.actions}>
                <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={() => window.location.assign('/')}
                >
                    Go to Dashboard
                </button>
                <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() => window.location.reload()}
                >
                    Reload
                </button>
            </div>
            {resetErrorBoundary && (
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
