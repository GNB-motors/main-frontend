export default function Nav() {
  return (
    <div style={{ position: "sticky", top: "0", zIndex: "80", padding: "0 40px", background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(5,8,22,.08)", transition: "box-shadow 200ms cubic-bezier(.2,0,0,1)", boxShadow: "none" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
        <div data-navzone style={{ display: "flex", alignItems: "center", gap: "26px", height: "78px" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: "11px", color: "#050816" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "9px", background: "var(--nova-gradient-rage)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "#fff", letterSpacing: "-.5px" }}>G</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.3px", whiteSpace: "nowrap" }}>GNB Edge</span>
          </a>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" style={{ width: "42px", height: "42px", borderRadius: "999px", background: "#F4F5FA", border: "1px solid rgba(5,8,22,.10)", color: "#050816", cursor: "pointer", display: "grid", placeItems: "center", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <a href="#demo" data-navcta style={{ fontFamily: "var(--font-ui)", fontSize: "15px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "12px 26px", borderRadius: "999px", whiteSpace: "nowrap", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
          </div>
        </div>
      </div>
    </div>
  );
}
