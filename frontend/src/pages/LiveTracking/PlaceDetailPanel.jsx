import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  MapPin,
  Navigation,
  ScanLine,
  Truck,
} from 'lucide-react';
import { openInGoogleMaps } from '../../utils/googleMapsLink.js';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { radiusLabel } from '../PlaceHub/model/placeLabels.js';
import { vehiclesAtPlace } from './trackPlaces.js';
import { NOVA_STATUS } from './statusPalettes.js';
import PlaceStatRow from './PlaceStatRow';
import PlaceLandmarkActions from './PlaceLandmarkActions';
import PlaceRecentVisits from './PlaceRecentVisits';
import PlaceCampusList from './PlaceCampusList';
import { isOurPlace } from './placePanelModel.js';
import usePlaceStats from './usePlaceStats.js';
import { formatDuration } from '../../utils/redesign/format';
import './PlaceDetailPanel.css';

export default function PlaceDetailPanel({ place, vehicles, onBack, onPickVehicle }) {
  const here = useMemo(() => vehiclesAtPlace(place, vehicles), [place, vehicles]);
  const ours = isOurPlace(place);
  const { stats } = usePlaceStats(place);

  if (!place) return <div className="railview railview--detail" aria-live="polite" />;

  const { Icon, color } = styleOfType(place.type);
  const hasBoundary = Boolean(
    place.polygon?.length || place.polygonParts?.length || place.coreParts?.length,
  );
  const coordinates =
    Number.isFinite(place.lat) && Number.isFinite(place.lng)
      ? `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`
      : 'Not available';

  return (
    <div className="railview railview--detail open lt-place-detail" aria-live="polite">
      <div className="pd-topbar">
        <button type="button" className="pd-back" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden="true" /> All places
        </button>
        <span className="pd-context">Place details</span>
      </div>
      <div className="pd-body">
        <header className="pd-hero">
          <div className="pd-identity">
            <div className="pd-place-icon" style={{ '--pd-type-color': color }}>
              <Icon size={23} aria-hidden="true" />
            </div>
            <div className="pd-title">
              <div className="pd-type">
                {place.type ? placeTypeLabel(place.type) : place.category || 'Place'}
              </div>
              <h2>{place.name || 'Location not known'}</h2>
            </div>
          </div>
          {place.subtitle ? (
            <p className="pd-location">
              <MapPin size={13} aria-hidden="true" />
              {place.subtitle}
            </p>
          ) : null}
          <div className="pd-meta">
            <span className={`pd-ownership ${ours ? 'is-ours' : ''}`}>
              <span aria-hidden="true" />
              {ours ? 'Our place' : 'Map landmark'}
            </span>
          </div>
          <div className="pd-actions">
            <button
              type="button"
              className="pd-action pd-action--primary"
              onClick={() => openInGoogleMaps({ lat: place.lat, lng: place.lng, name: place.name })}
            >
              <Navigation size={14} aria-hidden="true" /> Open in Maps{' '}
              <ArrowUpRight size={13} aria-hidden="true" />
            </button>
            <Link className="pd-action" to="/place-hub">
              Manage places <ChevronRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <PlaceStatRow stats={stats} trucksHere={here.length} />
        <div className="pd-extra">
          <PlaceLandmarkActions place={place} />
        </div>

        <section className="pd-section" aria-label="Vehicles here now">
          <div className="pd-section-head">
            <h3>
              <Truck size={15} aria-hidden="true" /> Vehicles here now{' '}
              <span className="pd-count">{here.length}</span>
            </h3>
            <span className="pd-live">
              <span aria-hidden="true" /> Live GPS
            </span>
          </div>
          {here.length === 0 ? (
            <p className="pd-empty">No vehicle with a live GPS fix is inside this place.</p>
          ) : (
            <ul className="pd-vehicle-list">
              {here.map((v) => {
                const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      className="pd-vehicle"
                      onClick={() => onPickVehicle(v.id)}
                    >
                      <span className="pd-truck-icon">
                        <Truck size={17} aria-hidden="true" />
                      </span>
                      <span className="pd-vehicle-copy">
                        <strong>{v.plate}</strong>
                        <span>
                          {v.ago != null
                            ? `Last report ${formatDuration(v.ago)} ago`
                            : 'Report time unavailable'}
                        </span>
                      </span>
                      <span className="pd-status" style={{ '--pd-status-color': s.c }}>
                        <span aria-hidden="true" />
                        {s.label}
                      </span>
                      <ChevronRight className="pd-row-chevron" size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {ours ? <PlaceRecentVisits key={place.id} place={place} /> : null}
        <div className="pd-extra">
          <PlaceCampusList place={place} />
        </div>

        <details className="pd-information">
          <summary>
            <ScanLine size={15} aria-hidden="true" />
            <span>Place information</span>
            <ChevronDown size={15} className="pd-info-chevron" aria-hidden="true" />
          </summary>
          <dl>
            <div>
              <dt>{hasBoundary ? 'Boundary' : 'Radius'}</dt>
              <dd>{hasBoundary ? 'Drawn area' : radiusLabel(place.radiusM)}</dd>
            </div>
            <div>
              <dt>Coordinates</dt>
              <dd>{coordinates}</dd>
            </div>
          </dl>
        </details>
      </div>
    </div>
  );
}
