export default function OwnerInsights() {
  return (
    <div data-reveal-group style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div
        data-mcol3
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 70px',
          gap: '32px',
          alignItems: 'baseline',
          padding: '30px 0',
          borderTop: '1px solid rgba(5,8,22,.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '44px',
            letterSpacing: '-1.7px',
            color: 'var(--nova-rage-600)',
            lineHeight: '1',
          }}
        >
          12%
        </span>
        <span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '22px',
              letterSpacing: '-.5px',
              color: '#050816',
            }}
          >
            Mileage on your Tata 1109 is down this month
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '15.5px',
              lineHeight: '25px',
              color: '#5D5D5E',
              marginTop: '9px',
              maxWidth: '640px',
            }}
          >
            Same route, same load. Worth checking the air filter and tyre pressure before the next
            long run.
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            textAlign: 'right',
          }}
        >
          conf 0.90
        </span>
      </div>
      <div
        data-mcol3
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 70px',
          gap: '32px',
          alignItems: 'baseline',
          padding: '30px 0',
          borderTop: '1px solid rgba(5,8,22,.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '44px',
            letterSpacing: '-1.7px',
            color: 'var(--nova-rage-600)',
            lineHeight: '1',
          }}
        >
          ₹64,000
        </span>
        <span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '22px',
              letterSpacing: '-.5px',
              color: '#050816',
            }}
          >
            Where this month is heading
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '15.5px',
              lineHeight: '25px',
              color: '#5D5D5E',
              marginTop: '9px',
              maxWidth: '640px',
            }}
          >
            About ₹9,000 below last month, mostly from two empty return runs on the Solapur side.
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            textAlign: 'right',
          }}
        >
          conf 0.85
        </span>
      </div>
      <div
        data-mcol3
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 70px',
          gap: '32px',
          alignItems: 'baseline',
          padding: '30px 0',
          borderTop: '1px solid rgba(5,8,22,.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '44px',
            letterSpacing: '-1.7px',
            color: 'var(--nova-rage-600)',
            lineHeight: '1',
          }}
        >
          ₹2,400
        </span>
        <span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontWeight: '500',
              fontSize: '22px',
              letterSpacing: '-.5px',
              color: '#050816',
            }}
          >
            Short on every Solapur run
          </span>
          <span
            style={{
              display: 'block',
              fontSize: '15.5px',
              lineHeight: '25px',
              color: '#5D5D5E',
              marginTop: '9px',
              maxWidth: '640px',
            }}
          >
            At today’s diesel price that lane needs ₹2,400 more per trip just to break even.
          </span>
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: '#93939A',
            textAlign: 'right',
          }}
        >
          conf 0.80
        </span>
      </div>
      <div
        style={{
          paddingTop: '26px',
          borderTop: '1px solid rgba(5,8,22,.1)',
          fontSize: '15px',
          lineHeight: '24px',
          color: '#93939A',
        }}
      >
        All three arrive as one message at 07:00. Nothing to log in to, nothing to read a report
        for.
      </div>
    </div>
  );
}
