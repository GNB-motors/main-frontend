import Skel from './Skel.jsx';
import VehicleCardSkeleton from './VehicleCardSkeleton.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText } from './minutesAgoFormat.js';

const SKEL_CARD_COUNT = 6;

export default function FleetListView({
  isLiveLoading,
  vehicles,
  filteredVehicles,
  counts,
  setIsRailOpen,
  triggerMapResize,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  selectedId,
  setSelectedId,
}) {
  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>Fleet</h2>
          <div className="fsub">
            {isLiveLoading ? (
              <Skel w={120} h={10} />
            ) : vehicles.length === 0 ? (
              '0 vehicles · 0 live'
            ) : filteredVehicles.length === vehicles.length ? (
              `${vehicles.length} vehicles · ${counts.gps} live`
            ) : (
              `${filteredVehicles.length} of ${vehicles.length} vehicles`
            )}
          </div>
        </div>

        <button
          className="btn btn--sm btn--icon"
          title="Hide list"
          aria-label="Hide list"
          onClick={() => {
            setIsRailOpen(false);
            setTimeout(triggerMapResize, 240);
          }}
        >
          {renderIconSvg('chevRight', 16)}
        </button>
      </div>

      {/* Live Search Bar */}
      <div className="fsearch">
        {renderIconSvg('search', 16)}
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search plate, chassis, model…"
          autoComplete="off"
          aria-label="Search fleet"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd>/</kbd>
      </div>

      {/* Cards List */}
      <div className="flist" aria-busy={isLiveLoading}>
        {isLiveLoading ? (
          Array.from({ length: SKEL_CARD_COUNT }, (_, i) => <VehicleCardSkeleton key={i} />)
        ) : !filteredVehicles.length ? (
          <div className="fempty">
            {vehicles.length === 0
              ? "No vehicles found in your organization's fleet."
              : 'No vehicles match this filter.'}
          </div>
        ) : (
          filteredVehicles.slice(0, 120).map((v) => {
            const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
            const isSel = v.id === selectedId;

            return (
              <div
                key={v.id}
                className={`vcard ${isSel ? 'is-sel' : ''}`}
                role="button"
                tabIndex={0}
                style={{ '--c': s.c }}
                onClick={() => setSelectedId(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(v.id);
                  }
                }}
              >
                <div className="vc-top">
                  <div className="vc-id">
                    <div className="vc-plate">
                      {v.plate}
                      <span className="vc-model">{v.model}</span>
                    </div>
                    <div className="vc-vin">{v.vin ? `#${v.vin}` : '—'}</div>
                  </div>
                  <span className="vc-state">
                    <i />
                    {s.trip}
                  </span>
                </div>

                {/* Current location (real position) */}
                <div className="vc-loc">
                  {renderIconSvg('pin', 13)}
                  <span>{v.area || 'No location fix'}</span>
                </div>

                {/* Card Meta Footer */}
                <div className="vc-meta">
                  <span>
                    {renderIconSvg('fuel', 13)}
                    <b>{v.fuel != null ? `${v.fuel} L` : '—'}</b>
                  </span>
                  <span>
                    {renderIconSvg('zap', 13)}
                    {v.ignition}
                  </span>
                  <span>
                    {renderIconSvg('nav', 13)}
                    {v.gps}
                  </span>
                  <span className="sp" />
                  <span>{v.ago != null ? formatAgoText(v.ago) : '—'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
