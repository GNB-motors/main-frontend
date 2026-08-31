import ImageSlot from './ImageSlot.jsx';

export default function Hero() {
  return (
    <section id="top" data-screen-label="Hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.06fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "62px", lineHeight: "1.06", letterSpacing: "-2.2px", color: "#050816", margin: "0", textWrap: "pretty" }}>
            The unified{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>AI-native</span>
            {' '}platform for fleet operations.
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "30px 0 0", maxWidth: "560px", textWrap: "pretty" }}>From GPS telemetry and trip dispatch to GST, e-way bills, ledgers, payments and reporting, GNB Edge brings every part of fleet operations together on one intelligent platform, on web, mobile and API, built for single owners, contract fleets and enterprise networks alike.</p>
          <div style={{ display: "flex", gap: "32px", alignItems: "center", marginTop: "44px" }}>
            <a href="#demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 44px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
            <a href="#platform" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", display: "flex", alignItems: "center", gap: "9px" }}>
              See the platform{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>→</span>
            </a>
          </div>
        </div>
        <div data-reveal style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ aspectRatio: "4/3", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Dashboard on laptop" />
            </div>
            <div style={{ aspectRatio: "3/4", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Truck at depot" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "-40px" }}>
            <div style={{ aspectRatio: "3/4", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Driver with handheld" />
            </div>
            <div style={{ aspectRatio: "4/3", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Loading bay" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ aspectRatio: "4/3", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Control room screens" />
            </div>
            <div style={{ aspectRatio: "3/4", borderRadius: "18px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <ImageSlot placeholder="Highway convoy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
