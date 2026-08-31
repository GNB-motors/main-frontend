import ImageSlot from './ImageSlot.jsx';

export default function TripConsole() {
  return (
    <section data-screen-label="Trip console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>The dispatch board your operations room runs on.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 32px" }}>Open trips, unassigned loads and pending PODs on one screen, with every row opening into the full consignment record.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Costed against actual while the trip is still running</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>PODs land from the driver app straight onto the trip</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Closing a trip raises the invoice and posts to the ledger</div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", aspectRatio: "16/10" }}>
          <ImageSlot placeholder="Drop the dispatch board screenshot" />
        </div>
      </div>
    </section>
  );
}
