import React from 'react';
import { Boxes } from 'lucide-react';

const GraphNoManifest = ({ graphRootRef, theme }) => (
  <div
    ref={graphRootRef}
    className={`lemu-graph3d${theme === 'light' ? ' lemu-graph3d--light' : ''}`}
  >
    <div className="lemu-state">
      <div className="lemu-state__icon">
        <Boxes size={24} />
      </div>
      <div className="lemu-state__title">
        No manifest yet — the graph is built from the system manifest.
      </div>
    </div>
  </div>
);

export default GraphNoManifest;
