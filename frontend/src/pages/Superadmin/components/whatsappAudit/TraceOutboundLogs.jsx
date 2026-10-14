import { formatDate } from './waAuditFormat';

const TraceOutboundLogs = ({ traceData }) => (
  <div>
    <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 700 }}>
      Bot Outbound Delivery Receipts
    </h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {traceData.outboundMessages.map((msg, i) => (
        <div
          key={i}
          style={{
            padding: '10px 12px',
            background: 'var(--wa-bg)',
            borderRadius: 6,
            border: '1px solid var(--wa-border)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>Reply Kind: {msg.kind}</span>
            <div style={{ color: 'var(--wa-text-muted)', fontSize: 11 }}>
              {formatDate(msg.createdAt)}
            </div>
          </div>
          <span
            className={`wa-badge ${
              msg.status === 'DELIVERED' || msg.status === 'READ'
                ? 'wa-badge--success'
                : msg.status === 'FAILED'
                  ? 'wa-badge--fail'
                  : 'wa-badge--queued'
            }`}
          >
            {msg.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default TraceOutboundLogs;
