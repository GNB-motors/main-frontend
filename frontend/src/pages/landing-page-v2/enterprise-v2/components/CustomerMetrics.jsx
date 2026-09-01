export default function CustomerMetrics() {
  return (
    <section data-screen-label="Customer metrics" style={{ background: "#FFFFFF", padding: "96px 40px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="1240" data-prefix="" data-suffix=" vehicles">0 vehicles</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Largest single deployment on GNB Edge</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="38" data-prefix="" data-suffix=" depots">0 depots</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Managed from one control tower</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="6" data-prefix="" data-suffix=" entities">0 entities</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Separate books, consolidated reporting</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1", letterSpacing: "-1.7px" }}>
            <span data-count="4" data-prefix="" data-suffix=" days">0 days</span>
          </div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Median rollout per region</div>
        </div>
      </div>
    </section>
  );
}
