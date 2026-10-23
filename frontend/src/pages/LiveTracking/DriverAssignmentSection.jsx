import renderIconSvg from './renderIconSvg.jsx';

export default function DriverAssignmentSection({ selectedDriver }) {
  return (
    <details className="sec" open>
      <summary>
        {renderIconSvg('user', 16)}
        Driver &amp; assignment
        <span className="chev">{renderIconSvg('chevDown', 16)}</span>
      </summary>
      <div className="secbody">
        {selectedDriver ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {selectedDriver.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#F1F5F9' }}>
                  {selectedDriver.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Primary Driver
                  {selectedDriver.since ? ` · Since ${selectedDriver.since}` : ''}
                </div>
              </div>
            </div>
            {selectedDriver.phone ? (
              <a
                href={`tel:${selectedDriver.phone}`}
                className="btn btn--sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#187A32',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '12px',
                }}
              >
                {renderIconSvg('phone', 14)}
                Call
              </a>
            ) : (
              <span style={{ fontSize: '11px', color: '#64748B' }}>No phone</span>
            )}
          </div>
        ) : (
          <div className="secnote">No driver currently assigned to this vehicle in the ledger.</div>
        )}
      </div>
    </details>
  );
}
