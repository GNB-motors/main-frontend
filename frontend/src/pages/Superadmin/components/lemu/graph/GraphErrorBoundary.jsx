import React from 'react';

/* Error boundary around the graph renderer. The 3D chunk is lazy-loaded, so a
   chunk-load failure (deploy race, offline) or a WebGL crash would otherwise
   unmount the whole LEMU page. A retry re-renders the tree; if the error is
   persistent the boundary catches it again. */
class GraphErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (!error) return children;
    if (fallback) return fallback;
    return (
      <div className="lemu-state" role="alert">
        <div className="lemu-state__title">Graph renderer failed to load</div>
        <div className="lemu-state__title">
          Switch to table view to keep working — or retry to reload the graph.
        </div>
        <div className="lemu-state__title">
          <button type="button" className="lemu-btn lemu-btn--outline" onClick={this.handleRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }
}

export default GraphErrorBoundary;
