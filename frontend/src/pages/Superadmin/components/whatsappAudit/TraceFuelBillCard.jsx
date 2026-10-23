import { Receipt } from 'lucide-react';

const TraceFuelBillCard = ({ traceData }) => (
  <div
    className="wa-panel"
    style={{
      padding: 16,
      borderColor: '#bbf7d0',
      background: '#f8fdf9',
      marginBottom: 16,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <h4
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#166534',
        }}
      >
        <Receipt size={16} color="#16a34a" />
        Chat Fuel Bill Processing Details
      </h4>
      {traceData.draft?.status && (
        <span className="wa-badge wa-badge--success" style={{ textTransform: 'uppercase' }}>
          Draft {traceData.draft.status}
        </span>
      )}
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        fontSize: 12,
      }}
    >
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Bill Amount
        </span>
        <strong style={{ fontSize: 15, color: '#166534' }}>
          {traceData.draft?.amount ? `₹${traceData.draft.amount.toLocaleString()}` : '—'}
        </strong>
      </div>
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Fuel Litres
        </span>
        <strong>{traceData.draft?.litres ? `${traceData.draft.litres} L` : '—'}</strong>
      </div>
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Fuel Rate
        </span>
        <strong>{traceData.draft?.rate ? `₹${traceData.draft.rate}/L` : '—'}</strong>
      </div>
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Fuel Type / Filling
        </span>
        <strong>
          {traceData.draft?.fuelType || 'DIESEL'} ({traceData.draft?.fillingType || 'FULL_TANK'})
        </strong>
      </div>
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Plate on Bill
        </span>
        <strong>{traceData.draft?.plateText || traceData.vehicle?.vehicleReg || '—'}</strong>
      </div>
      <div>
        <span
          style={{
            color: 'var(--wa-text-muted)',
            display: 'block',
            fontSize: 11,
          }}
        >
          Odometer
        </span>
        <strong>
          {traceData.draft?.odometerReading ? `${traceData.draft.odometerReading} km` : 'Pending'}
        </strong>
      </div>
    </div>
  </div>
);

export default TraceFuelBillCard;
