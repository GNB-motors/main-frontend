export default function FuelCta() {
  return (
    <section id="fm-demo" data-screen-label="Fuel CTA" style={{ background: "#F4F5FA", padding: "104px 40px 96px" }}>
      <div data-reveal style={{ maxWidth: "1280px", margin: "0 auto", borderRadius: "var(--radius-ultra-soft)", background: "linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)", padding: "80px 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(circle at 85% 30%, #000, transparent 70%)" }} />
        <div style={{ position: "relative", maxWidth: "720px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.6px", color: "#FFFFFF", margin: "0", textWrap: "pretty" }}>Find out what your fuel bill is hiding.</h2>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "rgba(255,255,255,.84)", margin: "22px 0 36px" }}>Bring three months of refuelling data to the demo and we will run variance against your own routes on the call.</p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="#fm-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#213EA7", background: "#FFFFFF", border: "1px solid #FFFFFF", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
            <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.34)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Back to platform</a>
          </div>
        </div>
      </div>
    </section>
  );
}
