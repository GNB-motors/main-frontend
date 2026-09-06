export default function FuelMonitoring() {
  return (
    <section id="fuel" data-screen-label="Fuel monitoring" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Fuel monitoring and theft detection</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
            Every litre verified{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>against two independent records.</span>
          </h2>
          <p style={{ fontSize: "18px", lineHeight: "29px", color: "#5D5D5E", margin: "24px 0 36px", maxWidth: "560px", textWrap: "pretty" }}>We enable complete fuel monitoring and theft detection through the app, web platform, and WhatsApp bot. For every trip, users can upload an odometer photo and fuel bill photo.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "4px" }}>
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span style={{ fontSize: "16px", lineHeight: "26px", color: "#050816", textWrap: "pretty" }}>The system calculates each vehicle's actual mileage using the full-tank-to-full-tank method.</span>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "4px" }}>
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span style={{ fontSize: "16px", lineHeight: "26px", color: "#050816", textWrap: "pretty" }}>This data is then compared with fuel consumption data from vehicle hardware/telematics and other available data points to identify unusual fuel usage or potential fuel theft.</span>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "4px" }}>
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              <span style={{ fontSize: "16px", lineHeight: "26px", color: "#050816", textWrap: "pretty" }}>This creates a strong verification system, helping businesses closely monitor fuel consumption and significantly reduce the risk of fuel theft.</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "34px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.20)", boxShadow: "var(--shadow-xs)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M11 18.5h2" />
              </svg>
              <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Mobile app</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.20)", boxShadow: "var(--shadow-xs)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <rect x="2.5" y="4" width="19" height="13" rx="2" />
                <path d="M8 21h8" />
              </svg>
              <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Web platform</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.20)", boxShadow: "var(--shadow-xs)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <path d="M20.5 11.5a8.5 8.5 0 1 1-4.2-7.3" />
                <path d="M3.5 20.5l1.4-4.2a8.5 8.5 0 0 0 3 3.1z" />
                <path d="M8.8 9.2c.4 2.6 2.4 4.6 5 5l1-1.6 2 .8-.4 1.8c-2.9.4-6.6-2.4-7.6-5.6l1.4-1.2z" fill="rgba(68,105,240,.14)" />
              </svg>
              <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>WhatsApp bot</span>
            </span>
          </div>
          <div style={{ marginTop: "34px" }}>
            <a href="/fuel-and-mileage" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "var(--nova-rage-600)" }}>See fuel and mileage →</a>
          </div>
        </div>
        <div data-reveal style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", borderRadius: "24px", boxShadow: "var(--shadow-lg)", padding: "26px 24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", paddingBottom: "18px", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#93939A" }}>Trip GNB/2026/04817 · fuel check</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 11px", borderRadius: "999px", background: "rgba(229,104,107,.12)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#E5686B" }} />
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".16em", textTransform: "uppercase", color: "#C4494C" }}>Flagged</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <div style={{ flex: "1", padding: "16px 14px", borderRadius: "14px", background: "#FAFAFC", border: "1px dashed rgba(68,105,240,.30)", display: "flex", flexDirection: "column", alignItems: "center", gap: "9px", textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 12l4-3" />
                <path d="M12 3.5v2M20.5 12h-2M12 20.5v-2M3.5 12h2" />
              </svg>
              <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816" }}>Odometer photo</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>4,18,240 km</span>
            </div>
            <div style={{ flex: "1", padding: "16px 14px", borderRadius: "14px", background: "#FAFAFC", border: "1px dashed rgba(68,105,240,.30)", display: "flex", flexDirection: "column", alignItems: "center", gap: "9px", textAlign: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                <path d="M9.5 8h5M9.5 12h5" />
              </svg>
              <span style={{ fontSize: "12.5px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816" }}>Fuel bill photo</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E" }}>180 l · ₹18,240</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v15" />
              <path d="M7 14l5 5 5-5" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "16px 18px", borderRadius: "14px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.16)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Full tank to full tank</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "#050816" }}>3.9 km/l</span>
              </div>
              <div style={{ height: "6px", borderRadius: "999px", background: "rgba(68,105,240,.14)", overflow: "hidden", marginTop: "12px" }}>
                <div style={{ height: "100%", width: "68%", borderRadius: "999px", background: "linear-gradient(90deg, #4469F0, #213EA7)" }} />
              </div>
            </div>
            <div style={{ padding: "16px 18px", borderRadius: "14px", background: "#FAFAFC", border: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Telematics reading</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "#050816" }}>4.6 km/l</span>
              </div>
              <div style={{ height: "6px", borderRadius: "999px", background: "rgba(5,8,22,.08)", overflow: "hidden", marginTop: "12px" }}>
                <div style={{ height: "100%", width: "80%", borderRadius: "999px", background: "rgba(93,93,94,.55)" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "13px", marginTop: "16px", padding: "15px 17px", borderRadius: "14px", background: "rgba(229,104,107,.08)", border: "1px solid rgba(229,104,107,.26)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C4494C" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <path d="M12 4.5 21 19.5H3z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <div style={{ minWidth: "0" }}>
              <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#050816" }}>15% gap · 26 l unaccounted</div>
              <div style={{ fontSize: "12.5px", lineHeight: "19px", color: "#5D5D5E", marginTop: "2px" }}>Fuel audit raised on the Bhiwandi → Nagpur leg.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(5,8,22,.07)" }}>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Captured via</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5D5D5E", marginLeft: "auto" }}>app · web · WhatsApp bot</span>
          </div>
        </div>
      </div>
    </section>
  );
}
