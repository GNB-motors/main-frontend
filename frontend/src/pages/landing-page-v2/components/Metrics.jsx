export default function Metrics() {
  return (
    <section data-screen-label="Metrics" style={{ background: "#FFFFFF", padding: "88px 40px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="12" data-suffix=" → 1">0 → 1</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Systems collapsed into a single platform</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="30" data-suffix=" s">0 s</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Telemetry refresh across the live fleet map</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="92" data-suffix=" %">0 %</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Less manual entry on e-way bill paperwork</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "52px", lineHeight: "1", letterSpacing: "-2px", color: "#050816" }}>
            <span data-count="4" data-suffix=" days">0 days</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Median rollout across a multi-depot network</div>
        </div>
      </div>
    </section>
  );
}
