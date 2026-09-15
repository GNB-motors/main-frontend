export default function Nav() {
  return (
    <div style={{ position: "sticky", top: "0", zIndex: "80", padding: "0 40px", background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(5,8,22,.08)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "26px", height: "78px" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "11px", color: "#050816" }}>
          <span style={{ width: "30px", height: "30px", borderRadius: "9px", background: "var(--nova-gradient-rage)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "#fff", letterSpacing: "-.5px" }}>G</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.3px", whiteSpace: "nowrap" }}>GNB Edge</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "14px", fontSize: "14px", color: "#93939A" }}>
          <span>/</span>
          <span style={{ color: "#5D5D5E" }}>Platform</span>
          <span>/</span>
          <span style={{ color: "#050816", fontWeight: "500" }}>Live fleet map</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <a href="/" style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: "600", color: "#5D5D5E", padding: "11px 18px", whiteSpace: "nowrap" }}>← Back to overview</a>
          <a href="#fm-demo" style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "12px 26px", borderRadius: "999px", whiteSpace: "nowrap", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
        </div>
      </div>
    </div>
  );
}
