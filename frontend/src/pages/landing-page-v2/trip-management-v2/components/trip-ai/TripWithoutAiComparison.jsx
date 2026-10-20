export default function TripWithoutAiComparison() {
  return (
    <div
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(5,8,22,.07)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        padding: '30px 32px 26px',
      }}
    >
      <div
        data-mcol2
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          paddingBottom: '18px',
        }}
      >
        <div style={{ paddingRight: '28px' }}>
          <div
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#93939A',
            }}
          >
            The same trip without AI
          </div>
        </div>
        <div
          style={{
            paddingLeft: '28px',
            borderLeft: '1px solid rgba(5,8,22,.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              animation: 'ai-blip 2.2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-eyebrow)',
              fontSize: '10px',
              fontWeight: '500',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--nova-rage-600)',
            }}
          >
            With GNB Edge AI
          </span>
        </div>
      </div>
      <div
        data-mcol2
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          borderTop: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            padding: '22px 28px 22px 0',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#93939A',
          }}
        >
          Quoted from last year’s rate card and a feel for the lane.
        </div>
        <div
          style={{
            padding: '22px 0 22px 28px',
            borderLeft: '1px solid rgba(5,8,22,.06)',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#050816',
          }}
        >
          Priced on 34 comparable runs. Predicted landed cost ₹38,900 against ₹42,600 quoted, at
          booking.
        </div>
      </div>
      <div
        data-mcol2
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          borderTop: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            padding: '22px 28px 22px 0',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#93939A',
          }}
        >
          The delay is discovered when the client calls to ask.
        </div>
        <div
          style={{
            padding: '22px 0 22px 28px',
            borderLeft: '1px solid rgba(5,8,22,.06)',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#050816',
          }}
        >
          Arrival slip of 42 minutes flagged at 14:20. Client notified before they noticed.
        </div>
      </div>
      <div
        data-mcol2
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          borderTop: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            padding: '22px 28px 22px 0',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#93939A',
          }}
        >
          POD chased at month end, invoice raised a week late.
        </div>
        <div
          style={{
            padding: '22px 0 22px 28px',
            borderLeft: '1px solid rgba(5,8,22,.06)',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#050816',
          }}
        >
          POD matched to the trip on upload, invoice drafted, ledger posted the same day.
        </div>
      </div>
      <div
        data-mcol2
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          borderTop: '1px solid rgba(5,8,22,.06)',
        }}
      >
        <div
          style={{
            padding: '22px 28px 22px 0',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#93939A',
          }}
        >
          Mumbai → Indore quietly loses margin for a quarter.
        </div>
        <div
          style={{
            padding: '22px 0 22px 28px',
            borderLeft: '1px solid rgba(5,8,22,.06)',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#050816',
          }}
        >
          Lane flagged at 11% below costed margin after eight trips, with detention named as the
          cause.
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          paddingTop: '22px',
          marginTop: '6px',
          borderTop: '2px solid rgba(5,8,22,.1)',
        }}
      >
        <span style={{ fontSize: '15.5px', fontWeight: '600' }}>
          Quote to hold on the Surat renewal
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '28px',
              letterSpacing: '-1px',
              color: 'var(--nova-rage-600)',
            }}
          >
            ₹46,200
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
            conf 0.83
          </span>
        </span>
      </div>
    </div>
  );
}
