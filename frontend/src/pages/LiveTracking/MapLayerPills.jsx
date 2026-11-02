import { useEffect, useRef, useState } from 'react';
import renderIconSvg from './renderIconSvg.jsx';

/* Fleet-wide map layers, beside the status cards in the top bar. Layers about
   one vehicle (trip segments, habitual halts) live in that vehicle's panel.
   What the congestion colours mean opens on demand from an ⓘ beside its pill,
   so it never takes space from the fleet or places lists. */
export default function MapLayerPills({
  isPlacesVisible,
  placesLoading,
  placesCount = 0,
  togglePlaces,
  isCongestionVisible,
  congestionLoading,
  congestionCount = 0,
  toggleCongestion,
  congestionDetails = null,
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const wrapRef = useRef(null);
  const canShowInfo = isCongestionVisible && Boolean(congestionDetails);

  useEffect(() => {
    if (!canShowInfo) setInfoOpen(false);
  }, [canShowInfo]);

  useEffect(() => {
    if (!infoOpen) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setInfoOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setInfoOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [infoOpen]);

  return (
    <div className="lt-layer-pills" role="group" aria-label="Map layers">
      <button
        type="button"
        className="lt-make lt-layer-pill"
        aria-pressed={isPlacesVisible}
        title={
          isPlacesVisible ? 'Hide places on the map' : 'Show your places (Place Hub) on the map'
        }
        onClick={togglePlaces}
      >
        {renderIconSvg('pin', 14)}
        {placesLoading
          ? 'Loading places…'
          : isPlacesVisible && placesCount > 0
            ? `Places · ${placesCount}`
            : 'Places'}
      </button>
      <div className="lt-layer-pill-wrap" ref={wrapRef}>
        <button
          type="button"
          className="lt-make lt-layer-pill"
          aria-pressed={isCongestionVisible}
          title="Congestion on the roads our own trucks drive, against the boundary we learned for each road class"
          onClick={() => toggleCongestion(!isCongestionVisible)}
        >
          {renderIconSvg('road', 14)}
          {congestionLoading
            ? 'Loading congestion…'
            : isCongestionVisible && congestionCount > 0
              ? `Congestion · ${congestionCount}`
              : 'Congestion'}
        </button>
        {canShowInfo && (
          <button
            type="button"
            className="lt-make lt-layer-info"
            aria-label="What the congestion colours mean"
            title="What the congestion colours mean"
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen((v) => !v)}
          >
            {renderIconSvg('info', 14)}
          </button>
        )}
        {canShowInfo && infoOpen && (
          <div className="lt-layer-popover" role="dialog" aria-label="Congestion details">
            {congestionDetails}
          </div>
        )}
      </div>
    </div>
  );
}
