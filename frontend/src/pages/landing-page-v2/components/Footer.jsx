export default function Footer() {
  return (
    <footer style={{ background: "#F4F5FA", padding: "0 40px 56px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid rgba(5,8,22,.10)", paddingTop: "64px", display: "grid", gridTemplateColumns: "1.3fr repeat(4,1fr)", gap: "48px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", color: "#050816", marginBottom: "20px" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "9px", background: "var(--nova-gradient-rage)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "14px", color: "#fff" }}>G</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.3px", whiteSpace: "nowrap" }}>GNB Edge</span>
          </div>
          <p style={{ fontSize: "15px", lineHeight: "24px", color: "#5D5D5E", maxWidth: "280px" }}>The unified platform for fleet operations. Tracking, ERP, CRM, compliance and finance on one system.</p>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A", marginBottom: "18px" }}>Platform</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            <a href="/vehicle-tracking" style={{ fontSize: "15px", color: "#5D5D5E" }}>Platform overview</a>
            <a href="#ai" style={{ fontSize: "15px", color: "#5D5D5E" }}>AI insights</a>
            <a href="/live-fleet-map" style={{ fontSize: "15px", color: "#5D5D5E" }}>Live fleet map</a>
            <a href="/vehicle-tracking" style={{ fontSize: "15px", color: "#5D5D5E" }}>Vehicle tracking</a>
            <a href="/trips" style={{ fontSize: "15px", color: "#5D5D5E" }}>Trip and dispatch</a>
            <a href="/driver-management" style={{ fontSize: "15px", color: "#5D5D5E" }}>Driver management</a>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A", marginBottom: "18px" }}>Enterprise</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>ERP</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>CRM</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>Ledgers and finance</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>Payments</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>Reporting</a>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A", marginBottom: "18px" }}>Compliance</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>GST filing</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>E-way bills</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>E-invoicing</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>Audit trail</a>
            <a href="#capabilities" style={{ fontSize: "15px", color: "#5D5D5E" }}>Data residency</a>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".24em", textTransform: "uppercase", color: "#93939A", marginBottom: "18px" }}>Company</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            <a href="/about" style={{ fontSize: "15px", color: "#5D5D5E" }}>About GNB Edge</a>
            <a href="/contact-us" style={{ fontSize: "15px", color: "#5D5D5E" }}>Contact us</a>
            <a href="#top" style={{ fontSize: "15px", color: "#5D5D5E" }}>Careers</a>
            <a href="#top" style={{ fontSize: "15px", color: "#5D5D5E" }}>Partners</a>
            <a href="#top" style={{ fontSize: "15px", color: "#5D5D5E" }}>Trust centre</a>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "1280px", margin: "56px auto 0", paddingTop: "26px", borderTop: "1px solid rgba(5,8,22,.08)", display: "flex", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "14px", color: "#93939A" }}>© 2026 GNB Edge. All rights reserved.</div>
        <div style={{ display: "flex", gap: "26px" }}>
          <a href="#top" style={{ fontSize: "14px", color: "#93939A" }}>Privacy policy</a>
          <a href="#top" style={{ fontSize: "14px", color: "#93939A" }}>Terms of service</a>
          <a href="#top" style={{ fontSize: "14px", color: "#93939A" }}>Security</a>
        </div>
      </div>
    </footer>
  );
}
