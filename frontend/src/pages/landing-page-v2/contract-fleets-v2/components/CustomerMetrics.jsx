export default function CustomerMetrics() {
  return (
    <section data-screen-label="Customer metrics" style={{ background: "#FFFFFF", padding: "96px 40px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="98" data-prefix="" data-suffix="%">0%</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>On-time performance proven from telemetry</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="4" data-prefix="" data-suffix=" way">0 way</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Margin cut by contract, route, vehicle, driver</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="24" data-prefix="" data-suffix=" h">0 h</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Client reporting cycle, not monthly</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="1" data-prefix="" data-suffix=" portal">0 portal</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Shared with clients, no login into your system</div>
        </div>
      </div>
    </section>
  );
}
