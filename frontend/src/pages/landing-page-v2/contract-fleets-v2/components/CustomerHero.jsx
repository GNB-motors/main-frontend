export default function CustomerHero() {
  return (
    <section data-screen-label="Customer hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px 112px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 480px at 50% 0%, rgba(68,105,240,.10), transparent 68%)" }} />
      <div data-reveal-group style={{ position: "relative", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "12px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "24px" }}>Customers · Contract fleets and 3PL</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "58px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", textWrap: "pretty" }}>
          Prove the SLA{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>before the client asks.</span>
        </h1>
        <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "28px auto 0", maxWidth: "660px", textWrap: "pretty" }}>Dedicated vehicles, agreed rates and monthly reporting your client actually trusts. Every trip carries its own evidence, so a service review takes minutes instead of a week of reconstruction.</p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginTop: "40px", flexWrap: "wrap" }}>
          <a href="#cust-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Book a demo</a>
          <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", background: "transparent", border: "1px solid rgba(5,8,22,.16)", padding: "18px 40px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>See the platform</a>
        </div>
      </div>
    </section>
  );
}
