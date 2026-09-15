export default function ContactNextSteps() {
  return (
    <section data-screen-label="Contact next steps" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 64px", maxWidth: "760px", textWrap: "pretty" }}>
          What happens after{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>you hit send.</span>
        </h2>
        <div data-reveal-group style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 300ms" }} />
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>1</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>A call, not a pitch deck</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Twenty minutes on what you run today and where the paperwork breaks.</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 800ms" }} />
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>2</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>A demo on your data</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Send one month of trips and fuel. We run it through the platform live.</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>3</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>A scoped rollout plan</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Which module first, who it touches, what it costs, and how to roll back.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
