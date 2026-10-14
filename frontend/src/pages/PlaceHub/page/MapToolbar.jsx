import { MapPinned, Satellite, Map as MapIcon, Maximize2, Building2 } from 'lucide-react';
import LocationSearch from '../LocationSearch.jsx';

export default function MapToolbar({
  isLoaded,
  onMapSearch,
  tab,
  showContext,
  setShowContext,
  showPoi,
  setShowPoi,
  satellite,
  setSatellite,
  setFitNonce,
}) {
  return (
    <div className="ph-map-top">
      <div className="ph-map-search">
        <LocationSearch
          isLoaded={isLoaded}
          onPick={onMapSearch}
          placeholder="Go to a town or address"
        />
      </div>
      <div className="ph-map-tools">
        {tab !== 'places' && (
          <button
            type="button"
            className={`ph-tool${showContext ? ' is-on' : ''}`}
            onClick={() => setShowContext((v) => !v)}
            aria-pressed={showContext}
            title="Show your warehouses and zones"
          >
            <MapPinned size={15} /> Your places
          </button>
        )}
        <button
          type="button"
          className={`ph-tool${showPoi ? ' is-on' : ''}`}
          onClick={() => setShowPoi((v) => !v)}
          aria-pressed={showPoi}
          title="Plants, sidings, pumps and dhabas the map data knows about — zoom in to see them"
        >
          <Building2 size={15} /> Map data
        </button>
        <button
          type="button"
          className={`ph-tool${satellite ? ' is-on' : ''}`}
          onClick={() => setSatellite((v) => !v)}
          aria-pressed={satellite}
          title={satellite ? 'Road map' : 'Satellite'}
        >
          {satellite ? <MapIcon size={15} /> : <Satellite size={15} />}
          {satellite ? 'Map' : 'Satellite'}
        </button>
        <button
          type="button"
          className="ph-tool"
          onClick={() => setFitNonce((n) => n + 1)}
          title="Fit everything in view"
          aria-label="Fit everything in view"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}
