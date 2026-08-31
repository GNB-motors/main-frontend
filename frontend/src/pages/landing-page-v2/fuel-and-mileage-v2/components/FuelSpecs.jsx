export default function FuelSpecs() {
  return (
    <section data-screen-label="Fuel specs" style={{ background: "#FFFFFF", padding: "88px 40px 96px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>±2 %</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Tank sensor reading tolerance</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>30 s</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Sampling interval, same as telemetry</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>4 way</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Variance cut by vehicle, route, driver, depot</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>90 d</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Consumption history retained by default</div>
        </div>
      </div>
    </section>
  );
}
