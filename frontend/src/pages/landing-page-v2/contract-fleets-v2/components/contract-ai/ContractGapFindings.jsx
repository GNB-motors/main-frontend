export default function ContractGapFindings() {
  return (
    <div
      data-mcol3
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: '14px',
        marginTop: '26px',
        paddingTop: '22px',
        borderTop: '1px solid rgba(5,8,22,.07)',
      }}
    >
      <div
        style={{
          padding: '18px 20px',
          borderRadius: '14px',
          background: 'rgba(229,104,107,.07)',
          border: '1px solid rgba(229,104,107,.2)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '26px',
            letterSpacing: '-.9px',
            color: '#C4494C',
          }}
        >
          ₹2.1L
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
          Billing leakage found
        </div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            color: '#5D5D5E',
            marginTop: '4px',
          }}
        >
          Detention hours never invoiced
        </div>
      </div>
      <div
        style={{
          padding: '18px 20px',
          borderRadius: '14px',
          background: '#F4F5FA',
          border: '1px solid transparent',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '26px',
            letterSpacing: '-.9px',
            color: '#050816',
          }}
        >
          96.2%
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
          SLA closing below floor
        </div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            color: '#5D5D5E',
            marginTop: '4px',
          }}
        >
          Two more late runs triggers penalty
        </div>
      </div>
      <div
        style={{
          padding: '18px 20px',
          borderRadius: '14px',
          background: '#F4F5FA',
          border: '1px solid transparent',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '26px',
            letterSpacing: '-.9px',
            color: '#050816',
          }}
        >
          ₹46,200
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '8px' }}>
          Rate to hold at renewal
        </div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            color: '#5D5D5E',
            marginTop: '4px',
          }}
        >
          Diesel up 6% since signing
        </div>
      </div>
    </div>
  );
}
