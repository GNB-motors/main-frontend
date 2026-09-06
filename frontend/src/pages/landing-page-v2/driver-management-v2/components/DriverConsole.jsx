import driverRoster from '../assets/gnb-driver-roster.png';

export default function DriverConsole() {
  return (
    <section data-screen-label="Driver console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>The roster your dispatcher actually works from.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 32px" }}>Availability, duty hours and document status on one screen, so assignment takes a glance rather than three phone calls.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Drivers with expired documents cannot be assigned a trip</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Advances paid on the road show against the trip, not a side register</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Settlement closes with the trip, in the same ledger accounts already read</div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", aspectRatio: "16/10" }}>
          <img src={driverRoster} alt="GNB Edge driver roster console" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>
    </section>
  );
}
