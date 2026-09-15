export default function MapSpecs() {
  return (
    <section data-screen-label="Map specs" style={{ background: "#F4F5FA", padding: "88px 40px 92px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="30" data-suffix=" s">0 s</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Telemetry refresh on every vehicle</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="1240" data-suffix="">0</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Vehicles on one map, one account</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="90" data-suffix=" days">0 days</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Route history you can replay</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="8" data-suffix=" types">0 types</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Alert types raised off the map</div>
        </div>
      </div>
    </section>
  );
}
