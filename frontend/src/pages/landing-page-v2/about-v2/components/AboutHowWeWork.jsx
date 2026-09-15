export default function AboutHowWeWork() {
  return (
    <section data-screen-label="About how we work" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 64px", maxWidth: "760px", textWrap: "pretty" }}>
          How we work with a fleet{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>from the first call.</span>
        </h2>
        <div data-reveal-group style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 300ms" }} />
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>1</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>We sit with your operations</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>A day at the depot before a line of configuration. We map what you actually do, not what the software prefers.</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 800ms" }} />
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>2</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>We configure to your rules</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Fields, roles, approvals and rate logic set up with your team, module by module, with rollback at every step.</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>3</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>We stay after go-live</div>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>The same people who set you up answer the phone six months later. Support is not handed to a different company.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
