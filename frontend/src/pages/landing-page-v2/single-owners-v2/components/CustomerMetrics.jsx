export default function CustomerMetrics() {
  return (
    <section data-screen-label="Customer metrics" style={{ background: "#FFFFFF", padding: "96px 40px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="1" data-prefix="" data-suffix=" truck">0 truck</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Minimum fleet size to get started</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="1" data-prefix="" data-suffix=" day">0 day</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>From signup to your first tracked trip</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="329" data-prefix="₹" data-suffix="">₹0</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Per vehicle per month, billed annually</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="0" data-prefix="" data-suffix=" staff">0 staff</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Back-office headcount you need to hire</div>
        </div>
      </div>
    </section>
  );
}
