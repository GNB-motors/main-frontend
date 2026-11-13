import { MapPin } from 'lucide-react';
import { fmtDate } from './receiptFormat';

/** Coordinates as a person reads them, or empty when none were supplied. */
const coordText = (coordinates) => {
  if (coordinates == null) return '';
  if (typeof coordinates === 'object') {
    const lat = coordinates.lat ?? coordinates.latitude;
    const lng = coordinates.lng ?? coordinates.longitude;
    return lat != null && lng != null ? `${lat}, ${lng}` : '';
  }
  return String(coordinates);
};

/**
 * The station facts a draft really carries.
 *
 * Nothing here is guessed: a field the photo did not give stays empty and the
 * card says so in plain words.
 */
const DetailStationCard = ({ stationInfo }) => {
  const stationName = stationInfo?.stationName || null;
  const coordinates = coordText(stationInfo?.coordinates) || null;
  const haltTime = stationInfo?.haltTime ?? null;
  const geofence = stationInfo?.isGeofenceMatch ?? null;
  const benchmarkRate = stationInfo?.benchmarkRate ?? null;
  const benchmarkPlace = stationInfo?.benchmarkPlace ?? null;
  const benchmarkDate = stationInfo?.benchmarkEffectiveDate ?? null;
  const billRate = stationInfo?.billRate ?? null;
  // A benchmark is only a benchmark when we know its rate, its place and the
  // day it applies from.
  const hasBenchmark = benchmarkRate != null && benchmarkPlace != null && benchmarkDate != null;
  const variance =
    hasBenchmark && Number.isFinite(Number(billRate)) && Number.isFinite(Number(benchmarkRate))
      ? Number(billRate) - Number(benchmarkRate)
      : null;

  return (
    <div className="ra-section-card" style={{ marginTop: 20 }}>
      <div className="ra-section-card__title">
        <MapPin size={15} /> Fuel Station Details
      </div>
      <div className="ra-grid-props">
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Station Name / Location</span>
          <span className="ra-prop__val font-mono">{stationName || 'Station not read from the photo.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Station GPS Location</span>
          <span className="ra-prop__val font-mono">{coordinates || 'Pump location not available.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Vehicle Halt Duration</span>
          <span className="ra-prop__val">{haltTime || 'Halt duration not available.'}</span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Geofence</span>
          <span className="ra-prop__val">
            {geofence === true
              ? 'Matched'
              : geofence === false
                ? 'Not matched'
                : 'Location match not checked.'}
          </span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate Benchmark</span>
          <span className="ra-prop__val">
            {hasBenchmark
              ? `₹${benchmarkRate}/L · ${benchmarkPlace} · from ${fmtDate(benchmarkDate)}`
              : 'Benchmark not available'}
          </span>
        </div>
        <div className="ra-prop">
          <span className="ra-prop__label">Rate Discrepancy</span>
          <span className="ra-prop__val">
            {variance != null
              ? `${variance > 0 ? '+' : ''}${Number(variance.toFixed(2))} ₹/L vs the benchmark`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DetailStationCard;
