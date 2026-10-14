import renderIconSvg from './renderIconSvg.jsx';

export default function VehicleInfoSection({ selectedVehicle }) {
  return (
    <details className="sec">
      <summary>
        {renderIconSvg('info', 16)}
        Vehicle information
        <span className="chev">{renderIconSvg('chevDown', 16)}</span>
      </summary>
      <div className="secbody">
        <div className="kv">
          <span className="k">Chassis / VIN</span>
          <span className="v">{selectedVehicle.vin || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Model</span>
          <span className="v">{selectedVehicle.model || '—'}</span>
        </div>
        <div className="kv">
          <span className="k">Odometer</span>
          <span className="v">
            {selectedVehicle.odo != null
              ? `${selectedVehicle.odo.toLocaleString('en-IN')} km`
              : '—'}
          </span>
        </div>
        <div className="kv">
          <span className="k">Registered</span>
          <span className="v">{selectedVehicle.regYear || '—'}</span>
        </div>
      </div>
    </details>
  );
}
