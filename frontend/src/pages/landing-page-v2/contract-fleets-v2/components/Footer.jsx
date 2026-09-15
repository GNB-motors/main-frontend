export default function Footer() {
  return (
    <footer style={{ background: "#FFFFFF", padding: "0 40px 48px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid rgba(5,8,22,.10)", paddingTop: "32px", display: "flex", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "14px", color: "#93939A" }}>© 2026 GNB Edge. All rights reserved.</div>
        <div style={{ display: "flex", gap: "26px" }}>
          <a href="/single-owners" style={{ fontSize: "14px", color: "#93939A" }}>Single owners</a>
          <a href="/enterprise" style={{ fontSize: "14px", color: "#93939A" }}>Enterprise</a>
          <a href="/about" style={{ fontSize: "14px", color: "#93939A" }}>About</a>
          <a href="/contact-us" style={{ fontSize: "14px", color: "#93939A" }}>Contact us</a>
          <a href="/" style={{ fontSize: "14px", color: "#93939A" }}>← GNB Edge platform</a>
        </div>
      </div>
    </footer>
  );
}
