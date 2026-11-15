import renderIconSvg from './renderIconSvg.jsx';

export default function VehicleMetricTiles({ vehicle, readings }) {
  return (
    <div className="metrics">
      <div className="metric">
        {renderIconSvg('fuel', 18)}
        <div>
          <div className="k">Fuel</div>
          <div className="v">{readings.fuel}</div>
        </div>
      </div>
      <div className="metric">
        {renderIconSvg('fuel', 18)}
        <div>
          <div className="k">DEF</div>
          <div className="v">{readings.def}</div>
        </div>
      </div>
      <div className="metric">
        {renderIconSvg('road', 18)}
        <div>
          <div className="k">Odometer</div>
          <div className="v">{readings.odometer}</div>
        </div>
      </div>
      <div className="metric">
        {renderIconSvg('gauge', 18)}
        <div>
          <div className="k">Speed</div>
          <div className="v">{vehicle.speed != null ? `${vehicle.speed} km/h` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
