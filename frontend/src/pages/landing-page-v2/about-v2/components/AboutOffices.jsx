import ImageSlot from './ImageSlot.jsx';

export default function AboutOffices() {
  return (
    <section data-screen-label="About offices" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "end", marginBottom: "56px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Where we are</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0", textWrap: "pretty" }}>
              One office.{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>On the road most weeks.</span>
            </h2>
          </div>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>We work out of one office in Kolkata, and the implementation team travels to your depots for onboarding rather than doing it over a call.</p>
        </div>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "stretch" }}>
          <div style={{ background: "#F4F5FA", borderRadius: "var(--radius-xl)", padding: "34px 32px 36px" }}>
            <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "16px" }}>Head office</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "34px", letterSpacing: "-1.2px" }}>Kolkata</div>
            <div style={{ fontSize: "16px", lineHeight: "26px", color: "#5D5D5E", marginTop: "14px", maxWidth: "360px" }}>Add your registered address here</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "24px", paddingTop: "22px", borderTop: "1px solid rgba(5,8,22,.1)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#5D5D5E" }}>Mon–Sat · 09:30–19:00</span>
              <a href="/contact-us" style={{ fontSize: "15px", fontWeight: "600" }}>Get in touch →</a>
            </div>
          </div>
          <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-md)", minHeight: "280px" }}>
            <ImageSlot placeholder="Office or team photo" />
          </div>
        </div>
      </div>
    </section>
  );
}
