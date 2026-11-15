import { Maximize2, Receipt, Gauge, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

/** The words for each photo of a chat-import row. */
const PHOTO_LABELS = {
  bill: 'Bill',
  pump: 'Pump screen',
  dashboard: 'Dashboard',
};

/** The tabs of the photos: the kind of each photo, numbered when it repeats. */
const photoTabs = (photos) => {
  const counts = new Map();
  return photos.map((photo) => {
    const base = PHOTO_LABELS[photo.kind] || 'Photo';
    const seen = (counts.get(base) || 0) + 1;
    counts.set(base, seen);
    return { photo, label: seen > 1 ? `${base} ${seen}` : base };
  });
};

const DrawerViewerPane = ({
  activeTab,
  setActiveTab,
  setZoom,
  setRotation,
  draft,
  currentImg,
  zoom,
  rotation,
  photos = [],
  photoIndex = 0,
  setPhotoIndex,
}) => {
  // A chat row can carry several photos (the pump, the bill, the dashboard).
  // Each one gets its own tab and is shown large.
  const chatPhotos = Array.isArray(photos) ? photos.filter((p) => p?.url) : [];
  const tabs = photoTabs(chatPhotos);

  return (
    <div className="ra-drawer__viewer-pane">
      <div className="ra-drawer__tab-strip">
        {tabs.length > 0 ? (
          tabs.map(({ photo, label }, index) => (
            <button
              key={photo.id || photo.url || index}
              type="button"
              className={`ra-drawer__tab ${photoIndex === index ? 'is-active' : ''}`}
              onClick={() => {
                setPhotoIndex?.(index);
                setZoom(1);
                setRotation(0);
              }}
            >
              {label}
            </button>
          ))
        ) : (
          <>
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
              Bill
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
                Dashboard
              </button>
            )}
          </>
        )}
      </div>

      <div className="ra-drawer__canvas">
        {currentImg ? (
          <img
            src={currentImg}
            alt={chatPhotos.length > 0 ? 'Photo from the chat' : 'Bill receipt preview'}
            className="ra-drawer__img"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        ) : (
          <div className="ra-image-empty">
            <Receipt size={32} />
            <div>Photo not available.</div>
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
};

export default DrawerViewerPane;
