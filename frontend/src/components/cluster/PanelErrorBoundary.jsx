import { Component } from 'react';
import logger from '../../utils/logger';

/**
 * PanelErrorBoundary — one failing endpoint must never blank the dashboard.
 * Wrap every independent data panel. Shows a quiet in-panel retry card.
 */
export default class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A panel's render crash is a real bug, not an API failure; send it to Sentry.
    logger.error('PanelErrorBoundary', error, {
      panel: this.props.name,
      componentStack: info?.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="cluster-inset flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
          <div className="cluster-title text-sm">This panel couldn&apos;t load</div>
          <div className="text-dim text-xs">
            {this.props.hint || 'The rest of the page is unaffected.'}
          </div>
          <button
            type="button"
            className="text-xs font-semibold"
            style={{ color: 'var(--gnb-400)' }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
