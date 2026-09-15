export default function MapHero() {
  return (
    <section data-screen-label="Map hero" style={{ position: "relative", background: "#F4F5FA", padding: "96px 40px 80px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0", background: "radial-gradient(880px 500px at 84% 0%, rgba(68,105,240,.12), transparent 68%)" }} />
      <div style={{ position: "absolute", inset: "0", backgroundImage: "linear-gradient(rgba(5,8,22,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(5,8,22,.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(circle at 20% 0%, #000, transparent 72%)" }} />
      <div data-reveal-group style={{ position: "relative", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "22px" }}>Platform · Live fleet map</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "58px", lineHeight: "1.05", letterSpacing: "-2px", margin: "0", maxWidth: "900px", textWrap: "pretty" }}>
          Every vehicle, every trip,{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>on one live map.</span>
        </h1>
        <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "26px 0 0", maxWidth: "660px", textWrap: "pretty" }}>Telemetry from every truck lands on one map with the trip, the driver and the consignment attached to the pin. Dispatch stops calling drivers to ask where the vehicle is.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "36px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 16px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0", boxShadow: "0 0 0 4px rgba(68,105,240,.14)" }} />
            <span style={{ fontSize: "13.5px", fontWeight: "500", color: "#050816" }}>1,043 moving</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 16px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#E5686B", boxShadow: "0 0 0 4px rgba(229,104,107,.14)", animation: "fm-blink 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "13.5px", fontWeight: "500", color: "#050816" }}>118 halted</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 16px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#F9A061", boxShadow: "0 0 0 4px rgba(249,160,97,.16)" }} />
            <span style={{ fontSize: "13.5px", fontWeight: "500", color: "#050816" }}>79 idle</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 16px", borderRadius: "999px", background: "rgba(68,105,240,.07)", border: "1px solid rgba(68,105,240,.18)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--nova-rage-600)" }}>refresh 30 s</span>
          </span>
        </div>
      </div>
    </section>
  );
}
