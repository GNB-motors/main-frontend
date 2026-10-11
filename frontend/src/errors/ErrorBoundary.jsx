/**
 * Error boundary for the app root and for the routed page area. Catches render
 * errors, reports them to Sentry, and shows the ErrorFallback UI instead of a
 * white screen.
 *
 * `resetKey`: when it changes, a caught error is cleared. The page-area boundary
 * passes the pathname, so navigating away from a crashed page recovers.
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

  // prevState.error guard: when the resetKey change is itself what made the
  // child throw, resetting here would re-throw immediately.
  componentDidUpdate(prevProps, prevState) {
    if (this.state.error && prevState.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
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
