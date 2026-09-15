export default function AboutMetrics() {
  return (
    <section data-screen-label="About metrics" style={{ background: "#F4F5FA", padding: "96px 40px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="1240" data-suffix=" vehicles">0 vehicles</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Running on the platform today</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="38" data-suffix=" depots">0 depots</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Across single owners to enterprise networks</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="12" data-suffix=" states">0 states</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Trips moving on GNB Edge every day</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="4" data-suffix=" days">0 days</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Median time from signature to first live trip</div>
        </div>
      </div>
    </section>
  );
}
