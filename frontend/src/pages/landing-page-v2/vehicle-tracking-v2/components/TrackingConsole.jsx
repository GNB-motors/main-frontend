import ImageSlot from './ImageSlot.jsx';

export default function TrackingConsole() {
  return (
    <section data-screen-label="Tracking console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>Built for the person watching the map all day.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 32px" }}>Filters persist, the map remembers where you left it, and every vehicle opens straight into its trip, driver and consignment record.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>One click from a pin to the consignment it is carrying</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Share a live tracking link with the client, no login required</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Replay any trip from the last 90 days, stop by stop</div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", aspectRatio: "16/10" }}>
          <ImageSlot placeholder="Drop the tracking console screenshot" />
        </div>
      </div>
    </section>
  );
}
