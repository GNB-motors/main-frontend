import { Maximize2, Receipt, Gauge, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const DrawerViewerPane = ({
  activeTab,
  setActiveTab,
  setZoom,
  setRotation,
  draft,
  currentImg,
  zoom,
  rotation,
}) => (
  <div className="ra-drawer__viewer-pane">
    <div className="ra-drawer__tab-strip">
      <button
        type="button"
        className={`ra-drawer__tab ${activeTab === 'bill' ? 'is-active' : ''}`}
        onClick={() => {
          setActiveTab('bill');
          setZoom(1);
          setRotation(0);
        }}
      >
        <Receipt size={14} />
        Fuel Bill Slip
      </button>
      {draft.odometerImageUrl && (
        <button
          type="button"
          className={`ra-drawer__tab ${activeTab === 'odometer' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('odometer');
            setZoom(1);
            setRotation(0);
          }}
        >
          <Gauge size={14} />
          Dashboard Odometer Photo
        </button>
      )}
    </div>

    <div className="ra-drawer__canvas">
      {currentImg ? (
        <img
          src={currentImg}
          alt="Bill receipt preview"
          className="ra-drawer__img"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      ) : (
        <div className="ra-image-empty">
          <Receipt size={32} />
          <div>No image uploaded for this entry</div>
        </div>
      )}
    </div>

    {/* Image Toolbar */}
    {currentImg && (
      <div className="ra-drawer__img-tools">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <span className="ra-drawer__zoom-pct">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3.5))}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <div className="ra-drawer__tool-divider" />
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          title="Rotate 90°"
          aria-label="Rotate 90 degrees"
        >
          <RotateCw size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
          title="Reset View"
          aria-label="Reset View"
        >
          Reset
        </button>
        <a
          href={currentImg}
          target="_blank"
          rel="noreferrer"
          className="ra-drawer__full-link"
          title="Open Full Resolution in new tab"
        >
          <Maximize2 size={13} /> Full Size
        </a>
      </div>
    )}
  </div>
);

export default DrawerViewerPane;
