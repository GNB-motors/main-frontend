import { MapPin, Clock } from 'lucide-react';

const DetailStationCard = ({ stationInfo }) => (
  <div className="ra-section-card" style={{ marginTop: 20 }}>
    <div className="ra-section-card__title">
      <MapPin size={15} /> Fuel Station &amp; Telematics Cross-Verification
    </div>
    <div className="ra-grid-props">
      <div className="ra-prop ra-prop--full">
        <span className="ra-prop__label">Station Name / Location</span>
        <span className="ra-prop__val font-mono">{stationInfo.stationName}</span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Station GPS Location</span>
        <span className="ra-prop__val font-mono">{stationInfo.coordinates}</span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Vehicle Halt Duration</span>
        <span className="ra-prop__val" style={{ color: 'var(--emerald-500, #10B981)' }}>
          <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
          {stationInfo.haltTime}
        </span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Regional Benchmark Diesel Rate</span>
        <span className="ra-prop__val">₹{stationInfo.benchmarkRate} / L</span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Rate Discrepancy</span>
        <span
          className="ra-prop__val"
          style={{
            color: stationInfo.isRateNormal
              ? 'var(--emerald-500, #10B981)'
              : 'var(--amber-500, #F59E0B)',
          }}
        >
          {stationInfo.rateDiff != null
            ? `${stationInfo.rateDiff > 0 ? '+' : ''}${stationInfo.rateDiff} ₹/L (${
                stationInfo.isRateNormal ? 'Within normal range' : 'Rate anomaly'
              })`
            : '—'}
        </span>
      </div>
    </div>
  </div>
);

export default DetailStationCard;
