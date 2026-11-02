import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import renderIconSvg from './renderIconSvg.jsx';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { radiusLabel } from '../PlaceHub/model/placeLabels.js';
import { vehiclesAtPlace } from './trackPlaces.js';
import { NOVA_STATUS } from './statusPalettes.js';

/* One place, slid in over the Places list like a vehicle's detail over the
   Fleet list. Read-only: editing a place belongs to Place Hub, one click away. */
export default function PlaceDetailPanel({ place, vehicles, onBack, onPickVehicle }) {
  const here = useMemo(() => vehiclesAtPlace(place, vehicles), [place, vehicles]);
  return (
    <div className={`railview railview--detail ${place ? 'open' : ''}`} aria-live="polite">
      {place && (
        <>
          <div className="dtop">
            <button className="backbtn" onClick={onBack}>
              {renderIconSvg('chevLeft', 16)}
              Places
            </button>
          </div>
          <div className="dbody">
            <div className="dhead">
              <div className="dtile" style={{ color: styleOfType(place.type).color }}>
                {renderIconSvg('pin', 22)}
              </div>
              <div className="dtitle">
                <div className="plate">{place.name}</div>
                <div className="model">{placeTypeLabel(place.type)}</div>
                {place.subtitle ? <div className="model">{place.subtitle}</div> : null}
              </div>
            </div>

            <div className="sections">
              <details className="sec" open>
                <summary>
                  {renderIconSvg('truck', 16)}
                  Vehicles here now · {here.length}
                  <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                </summary>
                <div className="secbody">
                  {here.length === 0 ? (
                    <div className="secnote">
                      No vehicle with a live GPS fix is inside this place.
                    </div>
                  ) : (
                    here.map((v) => {
                      const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className="pl-vehicle"
                          onClick={() => onPickVehicle(v.id)}
                        >
                          <b>{v.plate}</b>
                          <span style={{ color: s.c }}>{s.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </details>

              <details className="sec" open>
                <summary>
                  {renderIconSvg('info', 16)}
                  Place information
                  <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                </summary>
                <div className="secbody">
                  <div className="kv">
                    <span className="k">{place.polygon ? 'Boundary' : 'Radius'}</span>
                    <span className="v">
                      {place.polygon ? 'Drawn area' : radiusLabel(place.radiusM)}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">Coordinates</span>
                    <span className="v">
                      {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                    </span>
                  </div>
                  <Link className="pl-link" to={`/place-hub?place=${encodeURIComponent(place.id)}`}>
                    Open in Place Hub
                  </Link>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
