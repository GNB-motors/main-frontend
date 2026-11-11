import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';
import renderIconSvg from './renderIconSvg.jsx';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { radiusLabel } from '../PlaceHub/model/placeLabels.js';
import { vehiclesAtPlace } from './trackPlaces.js';
import { NOVA_STATUS } from './statusPalettes.js';
import PlaceName from '../../components/redesign/PlaceName';
import ToneBadge from '../../components/redesign/ToneBadge';
import PlaceStatRow from './PlaceStatRow';
import PlaceLandmarkActions from './PlaceLandmarkActions';
import PlaceRecentVisits from './PlaceRecentVisits';
import PlaceCampusList from './PlaceCampusList';
import { isOurPlace } from './placePanelModel.js';
import usePlaceStats from './usePlaceStats.js';
import { formatDuration } from '../../utils/redesign/format';

/**
 * One place, slid in over the Places list like a vehicle's detail over the
 * Fleet list. Read-only: editing a place belongs to Place Hub, one click
 * away.
 *
 * It answers, in order: which place is this, how busy is it, what can I do
 * about it, who is here now, and when was it here before.
 */
export default function PlaceDetailPanel({ place, vehicles, onBack, onPickVehicle }) {
  const here = useMemo(() => vehiclesAtPlace(place, vehicles), [place, vehicles]);
  const ours = isOurPlace(place);
  const { stats } = usePlaceStats(place);

  if (!place) {
    return <div className="railview railview--detail" aria-live="polite" />;
  }

  return (
    <div className="railview railview--detail open" aria-live="polite">
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
            <div className="plate">
              <PlaceName place={{ name: place.name, category: place.category }} showCategory />
            </div>
            <div className="model">
              {place.type ? placeTypeLabel(place.type) : null}
              {place.subtitle ? <div className="model">{place.subtitle}</div> : null}
            </div>
            <div className="mt-1">
              <ToneBadge tone={ours ? 'info' : 'watch'}>
                {ours ? 'Our place' : 'Map landmark'}
              </ToneBadge>
            </div>
          </div>
        </div>

        <div className="sections">
          {/* The three numbers about this place */}
          <PlaceStatRow stats={stats} trucksHere={here.length} />

          {/* What a driver can do about a landmark */}
          <PlaceLandmarkActions place={place} />

          <details className="sec" open>
            <summary>
              {renderIconSvg('truck', 16)}
              Vehicles here now · {here.length}
              <span className="chev">{renderIconSvg('chevDown', 16)}</span>
            </summary>
            <div className="secbody">
              {here.length === 0 ? (
                <div className="secnote">No vehicle with a live GPS fix is inside this place.</div>
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
                      {v.ago != null ? (
                        <span className="pl-ago">Last report {formatDuration(v.ago)} ago</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </details>

          {/* Only our own places have a visit history worth listing */}
          {ours ? <PlaceRecentVisits place={place} /> : null}

          {/* A plant is a campus: its gates, siding, parking and weighbridge */}
          <PlaceCampusList place={place} />

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
              <Link className="pl-link" to="/place-hub">
                Manage places →
              </Link>
              <button
                type="button"
                className="pl-link"
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                onClick={() =>
                  openInGoogleMaps({ lat: place.lat, lng: place.lng, name: place.name })
                }
              >
                <ExternalLink size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Open in Google Maps
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
