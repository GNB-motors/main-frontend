import ImageSlot from './ImageSlot.jsx';

export default function FuelConsole() {
  return (
    <section data-screen-label="Fuel console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>Variance you can act on, not a spreadsheet you argue about.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 32px" }}>Every flagged trip opens into its own telemetry, refuelling slips and driver record, so the conversation starts with evidence.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>A flagged drop shows where the truck was standing when it happened</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Refuelling slips reconcile against fuel card and vendor statements</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Fuel cost lands in route profitability without a second entry</div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", aspectRatio: "16/10" }}>
          <ImageSlot placeholder="Drop the fuel variance report screenshot" />
        </div>
      </div>
    </section>
  );
}
