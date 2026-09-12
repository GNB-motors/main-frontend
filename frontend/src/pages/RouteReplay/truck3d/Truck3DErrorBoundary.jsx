import React from 'react';
import { captureException } from '../../../utils/sentry';

/**
 * Silent boundary for the lazy 3-D truck chunk. Any failure — a missing
 * chunk, a deck.gl exception, a decoder that never arrives — renders nothing
 * so the mandatory 2-D heading marker stays the visible truck. Errors are
 * still reported; they just never reach the screen.
 */
class Truck3DErrorBoundary extends React.Component {
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
    return this.state.error ? null : this.props.children;
  }
}

export default Truck3DErrorBoundary;
