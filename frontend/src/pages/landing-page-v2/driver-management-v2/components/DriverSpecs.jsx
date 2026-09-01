export default function DriverSpecs() {
  return (
    <section data-screen-label="Driver specs" style={{ background: "#FFFFFF", padding: "88px 40px 96px" }}>
      <div data-reveal-group style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "24px" }}>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid var(--nova-rage-400)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>30 d</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Licence expiry warning window</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>9 doc</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Document types tracked per driver</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>1 tap</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>From trip close to driver settlement</div>
        </div>
        <div style={{ paddingLeft: "22px", borderLeft: "2px solid rgba(5,8,22,.10)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1", letterSpacing: "-1.6px" }}>24 mo</div>
          <div style={{ fontSize: "15px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px" }}>Duty and settlement history retained</div>
        </div>
      </div>
    </section>
  );
}
