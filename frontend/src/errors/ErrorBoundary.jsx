/**
 * Root error boundary. Catches render errors, reports them to Sentry,
 * and shows the ErrorFallback UI instead of a white screen.
 *
 * Class component — React requires class components for error boundaries.
 */
import React from 'react';
import { captureException } from '../utils/sentry';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    render() {
        if (this.state.error) {
            return (
                <ErrorFallback
                    error={this.state.error}
                    resetErrorBoundary={() => this.setState({ error: null })}
                />
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
