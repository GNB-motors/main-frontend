import SegmentArt from './SegmentArt.jsx';

export default function Segments() {
  return (
    <section data-screen-label="Segments" style={{ background: "#F4F5FA", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ maxWidth: "800px" }}>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Who it is for</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "46px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
            Built for every fleet.{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>Ready for every stage of growth.</span>
          </h2>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "22px 0 0" }}>Single owners, contract fleets and enterprise networks all run on the same platform.</p>
        </div>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginTop: "60px" }}>
          <article style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "transform 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "#F3F3F6" }}>
              <SegmentArt variant="owner" />
              <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "9px", padding: "8px 13px", borderRadius: "999px", background: "rgba(255,255,255,.92)", border: "1px solid rgba(5,8,22,.08)", backdropFilter: "blur(8px)", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", whiteSpace: "nowrap" }}>1 – 5 vehicles</span>
              </div>
            </div>
            <div style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "12px", background: "rgba(68,105,240,.08)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 16V7h10v9" />
                    <path d="M13 10h4l3 3.5V16" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Single owners</div>
              </div>
              <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px", textWrap: "pretty" }}>One truck, one app, full compliance without an accounts team.</div>
              <a href="/single-owners" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "600", color: "var(--nova-rage-600)", marginTop: "auto", paddingTop: "14px" }}>Explore →</a>
            </div>
          </article>
          <article style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "transform 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "#F3F3F6" }}>
              <SegmentArt variant="contract" />
              <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "9px", padding: "8px 13px", borderRadius: "999px", background: "rgba(255,255,255,.92)", border: "1px solid rgba(5,8,22,.08)", backdropFilter: "blur(8px)", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", whiteSpace: "nowrap" }}>10 – 100 vehicles</span>
              </div>
            </div>
            <div style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "12px", background: "rgba(68,105,240,.08)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 4h6v3H9z" />
                    <rect x="4" y="7" width="16" height="14" rx="2" />
                    <path d="M9.5 14l1.8 1.8 3.4-3.6" />
                  </svg>
                </span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Contract fleets</div>
              </div>
              <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px", textWrap: "pretty" }}>SLA tracking, client reporting and dedicated-vehicle operations.</div>
              <a href="/contract-fleets" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "600", color: "var(--nova-rage-600)", marginTop: "auto", paddingTop: "14px" }}>Explore →</a>
            </div>
          </article>
          <article style={{ display: "flex", flexDirection: "column", height: "566px", borderRadius: "24px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "transform 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1)" }}>
            <div style={{ position: "relative", flex: "1", overflow: "hidden", background: "#F3F3F6" }}>
              <SegmentArt variant="enterprise" />
              <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "9px", padding: "8px 13px", borderRadius: "999px", background: "rgba(255,255,255,.92)", border: "1px solid rgba(5,8,22,.08)", backdropFilter: "blur(8px)", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", whiteSpace: "nowrap" }}>100+ · multi-depot</span>
              </div>
            </div>
            <div style={{ minHeight: "176px", boxSizing: "border-box", padding: "26px 28px 30px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "12px", background: "rgba(68,105,240,.08)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="9" width="7" height="12" rx="1.5" />
                    <rect x="14" y="3" width="7" height="18" rx="1.5" />
                    <path d="M6 13h1M6 17h1M17 7h1M17 11h1M17 15h1" />
                  </svg>
                </span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "22px", letterSpacing: "-.5px", color: "#050816" }}>Enterprise</div>
              </div>
              <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", marginTop: "14px", textWrap: "pretty" }}>Multi-depot, multi-entity operations with centralised control.</div>
              <a href="/enterprise" style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: "600", color: "var(--nova-rage-600)", marginTop: "auto", paddingTop: "14px" }}>Explore →</a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
