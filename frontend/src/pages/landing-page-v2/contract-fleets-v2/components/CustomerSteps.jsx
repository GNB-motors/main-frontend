export default function CustomerSteps() {
  return (
    <section data-screen-label="Customer steps" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <h2 data-reveal style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 64px", maxWidth: "760px", textWrap: "pretty" }}>
          From contract signed to{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>client reporting live.</span>
        </h2>
        <div style={{ position: "relative" }}>
          <div data-reveal-group style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 300ms" }} />
              <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>1</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>Load your contract rates</div>
              <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Agreed rates, lanes and escalation clauses per client.</div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "52px", right: "-32px", top: "26px", height: "1px", background: "rgba(68,105,240,.22)", transformOrigin: "left", animation: "step-line 900ms cubic-bezier(.2,0,0,1) both 800ms" }} />
              <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>2</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>Map SLAs and vehicles</div>
              <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Dedicated vehicles, turnaround targets and detention terms.</div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", zIndex: "1", width: "52px", height: "52px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "0 4px 14px rgba(68,105,240,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", color: "var(--nova-rage-600)", marginBottom: "26px" }}>3</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "21px", letterSpacing: "-.4px", marginBottom: "10px" }}>Share the client portal</div>
              <div style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "300px" }}>Live tracking, PODs and a service report that builds itself.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
