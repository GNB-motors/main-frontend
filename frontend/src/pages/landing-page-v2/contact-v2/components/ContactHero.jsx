export default function ContactHero() {
  return (
    <section data-screen-label="Contact hero" style={{ position: "relative", background: "#F4F5FA", padding: "96px 40px 88px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 460px at 50% 0%, rgba(68,105,240,.10), transparent 68%)" }} />
      <div data-reveal-group style={{ position: "relative", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "24px" }}>Company · Contact us</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "56px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", textWrap: "pretty" }}>
          Tell us what you run.{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>We will show you what changes.</span>
        </h1>
        <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "28px auto 0", maxWidth: "620px", textWrap: "pretty" }}>One form, one reply from a person who knows fleet operations. No sequence of nurture emails.</p>
      </div>
    </section>
  );
}
