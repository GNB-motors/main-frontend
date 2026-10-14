import { Receipt, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';

const DetailInspectionPanel = ({
  activeTab,
  setActiveTab,
  setZoom,
  setRotation,
  draft,
  currentImg,
  zoom,
  rotation,
  setLightboxOpen,
}) => (
  <div className="ra-panel">
    <div className="ra-panel__head" style={{ justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Receipt size={16} />
        <span>Inspection Stage</span>
      </div>

      <div className="ra-drawer__tab-strip" style={{ margin: 0 }}>
        <button
          type="button"
          className={`ra-drawer__tab ${activeTab === 'bill' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('bill');
            setZoom(1);
            setRotation(0);
          }}
        >
          Fuel Bill Slip
        </button>
        {draft?.odometerImageUrl && (
          <button
            type="button"
            className={`ra-drawer__tab ${activeTab === 'odometer' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('odometer');
              setZoom(1);
              setRotation(0);
            }}
          >
            Odometer Photo
          </button>
        )}
      </div>
    </div>

    <div className="ra-panel__body">
      <div className="ra-drawer__canvas" style={{ minHeight: '440px' }}>
        {currentImg ? (
          <img
            src={currentImg}
            alt="Bill inspection"
            className="ra-drawer__img"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            draggable={false}
          />
        ) : (
          <div className="ra-image-empty">
            <Receipt size={36} />
            <div>No receipt image available for this draft</div>
          </div>
        )}
      </div>

      {/* Stage Controls */}
      {currentImg && (
        <div className="ra-drawer__img-tools" style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="ra-drawer__zoom-pct">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3.5))}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <div className="ra-drawer__tool-divider" />
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Rotate 90°"
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setRotation(0);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="ra-drawer__full-link"
          >
            <Maximize2 size={13} /> Fullscreen Lightbox
          </button>
        </div>
      )}
    </div>
  </div>
);

export default DetailInspectionPanel;
