export default function ClosingCta() {
  return (
    <section id="demo" data-screen-label="Closing CTA" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div data-reveal style={{ maxWidth: "1280px", margin: "0 auto", borderRadius: "var(--radius-ultra-soft)", background: "linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)", padding: "88px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(circle at 85% 30%, #000, transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: "740px" }}>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "rgba(255,255,255,.72)", marginBottom: "22px" }}>Get started</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "50px", lineHeight: "1.06", letterSpacing: "-1.8px", color: "#FFFFFF", margin: "0", textWrap: "pretty" }}>See your fleet running on one platform.</h2>
          <p style={{ fontSize: "19px", lineHeight: "30px", color: "rgba(255,255,255,.82)", margin: "24px 0 40px" }}>Bring your operations, accounts or IT team. We will show how GNB Edge unifies tracking, dispatch, ERP, CRM, GST, ledgers and payments on live data from your own routes.</p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="#demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#213EA7", background: "#FFFFFF", border: "1px solid #FFFFFF", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
            <a href="#demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.34)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Talk to sales</a>
          </div>
        </div>
      </div>
    </section>
  );
}
