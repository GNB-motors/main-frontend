import EnterpriseTopologyEntities from './EnterpriseTopologyEntities.jsx';
import EnterpriseGroupModelLayer from './EnterpriseGroupModelLayer.jsx';

export default function EnterpriseGroupTopology() {
  return (
    <div
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.18)',
        borderRadius: '22px',
        padding: '28px 30px 30px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
          }}
        >
          Governed model layer · group topology
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          6 entities · 38 depots · 1,240 vehicles
        </div>
      </div>
      <div>
        <div data-scroll-m>
          <div style={{ minWidth: '720px' }}>
            <EnterpriseTopologyEntities />
            <svg
              viewBox="0 0 300 46"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '46px', display: 'block' }}
            >
              <path
                d="M50 2 C50 26 150 20 150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M50 2 C50 26 150 20 150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 0s' }}
              />
              <path
                d="M150 2 L150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M150 2 L150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 0.4s' }}
              />
              <path
                d="M250 2 C250 26 150 20 150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M250 2 C250 26 150 20 150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 0.8s' }}
              />
            </svg>
            <EnterpriseGroupModelLayer />
            <svg
              viewBox="0 0 300 46"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '46px', display: 'block' }}
            >
              <path
                d="M150 2 C150 26 50 20 50 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M150 2 C150 26 50 20 50 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 0.2s' }}
              />
              <path
                d="M150 2 L150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M150 2 L150 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 0.6s' }}
              />
              <path
                d="M150 2 C150 26 250 20 250 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="rgba(68,105,240,.24)"
                strokeWidth="1.2"
              />
              <path
                d="M150 2 C150 26 250 20 250 44"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="#4469F0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="4 96"
                style={{ animation: 'ai-flow 2.6s linear infinite 1s' }}
              />
            </svg>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
              <div
                style={{
                  padding: '17px 19px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(68,105,240,.18)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Cross-entity anomalies
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: '#5D5D5E',
                    marginTop: '6px',
                  }}
                >
                  Three depots 14 points below group median utilisation
                </div>
              </div>
              <div
                style={{
                  padding: '17px 19px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(68,105,240,.18)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Group forecast
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: '#5D5D5E',
                    marginTop: '6px',
                  }}
                >
                  Cost per km trending to ₹31.40 in Q3, 4.6% above plan
                </div>
              </div>
              <div
                style={{
                  padding: '17px 19px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(68,105,240,.18)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: '600', letterSpacing: '-.1px' }}>
                  Board pack
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                    color: '#5D5D5E',
                    marginTop: '6px',
                  }}
                >
                  Generated on the 1st, same numbers finance signs off
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
