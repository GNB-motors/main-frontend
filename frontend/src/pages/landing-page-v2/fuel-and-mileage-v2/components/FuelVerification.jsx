export default function FuelVerification() {
  return (
    <section id="verification" data-screen-label="Fuel verification" style={{ background: "#F4F5FA", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ maxWidth: "860px" }}>
          <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>Fuel monitoring and theft detection</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "42px", lineHeight: "1.1", letterSpacing: "-1.4px", margin: "0 0 26px", textWrap: "pretty" }}>
            Theft shows up as a gap{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>between two independent records.</span>
          </h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0 0 16px", textWrap: "pretty" }}>We enable complete fuel monitoring and theft detection through the app, web platform, and WhatsApp bot. For every trip, users can upload an odometer photo and fuel bill photo.</p>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0 0 16px", textWrap: "pretty" }}>The system calculates each vehicle's actual mileage using the full-tank-to-full-tank method. This data is then compared with fuel consumption data from vehicle hardware/telematics and other available data points to identify unusual fuel usage or potential fuel theft.</p>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "0", textWrap: "pretty" }}>This creates a strong verification system, helping businesses closely monitor fuel consumption and significantly reduce the risk of fuel theft.</p>
        </div>
        <div data-reveal-group style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginTop: "56px", alignItems: "stretch" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "24px 22px 26px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
                  <circle cx="12" cy="13" r="3.2" />
                  <path d="M9 6.5l1.2-2h3.6l1.2 2" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>01</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px", color: "#050816" }}>Capture</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>An odometer photo and a fuel bill photo are uploaded against the trip, from whichever surface the driver or owner is on.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>app · web · WhatsApp bot</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "24px 22px 26px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 20a7 7 0 0 1 14 0z" />
                  <path d="M12 13l3.5-3.5" />
                  <path d="M3 20h18" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>02</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px", color: "#050816" }}>Calculate</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Actual mileage per vehicle is computed on the full-tank-to-full-tank method, not on a claimed figure.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>full tank → full tank · 3.9 km/l</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "24px 22px 26px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16" />
                  <path d="M4 8h16" />
                  <path d="M6.5 8l-2.5 5h5z" />
                  <path d="M17.5 8l-2.5 5h5z" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>03</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px", color: "#050816" }}>Compare</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>That number is checked against fuel consumption from vehicle hardware and telematics, and other available data points.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>telematics · 4.6 km/l</div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", borderRadius: "var(--radius-xl)", padding: "24px 22px 26px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(68,105,240,.09)", border: "1px solid rgba(68,105,240,.16)", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4.5 21 19.5H3z" />
                  <path d="M12 10v4M12 17h.01" />
                </svg>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>04</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", letterSpacing: "-.4px", color: "#050816" }}>Flag</div>
            <div style={{ fontSize: "14.5px", lineHeight: "23px", color: "#5D5D5E", textWrap: "pretty" }}>Unusual usage or potential theft is raised as a fuel audit against the trip, the vehicle and the driver.</div>
            <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(5,8,22,.07)", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)" }}>15% gap · 26 l unaccounted</div>
          </div>
        </div>
      </div>
    </section>
  );
}
