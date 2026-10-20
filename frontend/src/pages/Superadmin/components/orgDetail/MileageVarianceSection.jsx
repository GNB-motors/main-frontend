import { TrendingUp, TrendingDown, Radar, Satellite } from 'lucide-react';

const MileageVarianceSection = ({ loading, baseline, fleetEdge }) => (
  <div className="fuel-stats-section">
    <h2 className="fuel-stats-title">
      Mileage Variance <span>vs expected baseline &amp; FleetEdge telemetry</span>
    </h2>
    <div className="mileage-variance-grid">
      <div className="content-card mileage-variance-card">
        <div className="mileage-variance-card-header">
          <Radar size={16} />
          <span>Vs Expected Baseline</span>
        </div>
        {loading ? (
          <p className="mileage-variance-empty">Loading…</p>
        ) : !baseline || baseline.vehiclesConsidered === 0 ? (
          <p className="mileage-variance-empty">No completed mileage intervals in this range.</p>
        ) : (
          <div className="mileage-variance-body">
            <div className="mileage-variance-stat positive">
              <TrendingUp size={18} />
              <div>
                <span className="mileage-variance-count">{baseline.positiveCount}</span>
                <span className="mileage-variance-label">vehicles above expected</span>
              </div>
            </div>
            <div className="mileage-variance-stat negative">
              <TrendingDown size={18} />
              <div>
                <span className="mileage-variance-count">{baseline.negativeCount}</span>
                <span className="mileage-variance-label">vehicles below expected</span>
              </div>
            </div>
            <p className="mileage-variance-footnote">
              {baseline.vehiclesConsidered} vehicle
              {baseline.vehiclesConsidered !== 1 ? 's' : ''} considered
              {baseline.neutralCount ? `, ${baseline.neutralCount} exactly at baseline` : ''}.
            </p>
          </div>
        )}
      </div>

      <div className="content-card mileage-variance-card">
        <div className="mileage-variance-card-header">
          <Satellite size={16} />
          <span>Vs FleetEdge Telemetry</span>
        </div>
        {loading ? (
          <p className="mileage-variance-empty">Loading…</p>
        ) : !fleetEdge || fleetEdge.vehiclesConsidered === 0 ? (
          <p className="mileage-variance-empty">No FleetEdge data for this organisation.</p>
        ) : (
          <div className="mileage-variance-body">
            <div className="mileage-variance-stat positive">
              <TrendingUp size={18} />
              <div>
                <span className="mileage-variance-count">{fleetEdge.positiveCount}</span>
                <span className="mileage-variance-label">vehicles above telemetry</span>
              </div>
            </div>
            <div className="mileage-variance-stat negative">
              <TrendingDown size={18} />
              <div>
                <span className="mileage-variance-count">{fleetEdge.negativeCount}</span>
                <span className="mileage-variance-label">vehicles below telemetry</span>
              </div>
            </div>
            <p className="mileage-variance-footnote">
              {fleetEdge.vehiclesConsidered} vehicle
              {fleetEdge.vehiclesConsidered !== 1 ? 's' : ''} considered
              {fleetEdge.neutralCount ? `, ${fleetEdge.neutralCount} exactly at baseline` : ''}.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default MileageVarianceSection;
