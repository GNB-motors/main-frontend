import ImageSlot from './ImageSlot.jsx';

export default function Compliance() {
  return (
    <section data-screen-label="Compliance" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", boxShadow: "var(--shadow-lg)", aspectRatio: "4/3", order: "-1" }}>
          <ImageSlot placeholder="Drop a GST / e-way bill screen" />
        </div>
        <div data-reveal-group>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Compliance and finance</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.3px", margin: "0", textWrap: "pretty" }}>
            Compliance that files itself.{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>Books that reconcile themselves.</span>
          </h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 34px" }}>Every consignment generates its own paperwork. GNB Edge turns trip data into e-way bills, GST returns and ledger entries without a second round of data entry.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>E-way bills generated and extended directly from the trip record</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>GSTR-ready invoices with HSN, place of supply and reverse charge handled</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Party ledgers, advances and driver settlements in one running balance</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
