export default function CustomerArchitecture() {
  return (
    <section data-screen-label="Customer architecture" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div data-reveal style={{ maxWidth: "900px", margin: "0 auto 64px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>System architecture</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
          One platform across{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>every contract you run.</span>
        </h2>
      </div>
      <div data-reveal style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              SLA tracking
              <br />
              per contract
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <circle cx="12" cy="8" r="3.4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Client-facing
              <br />
              portal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <path d="M8.5 18h5a4 4 0 0 0 4-4V8.5" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Dedicated and
              <br />
              market vehicles
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Margin per
              <br />
              contract
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: ".95fr .34fr 1.55fr .3fr .52fr", alignItems: "center", gap: "0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "rgba(68,105,240,.07)", borderRadius: "18px", padding: "18px 16px 16px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "13px", paddingLeft: "2px" }}>Field channels</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", boxShadow: "var(--shadow-xs)" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                    <path d="M11 18.5h2" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px" }}>Driver app</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", boxShadow: "var(--shadow-xs)" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                    <circle cx="12" cy="12" r="8.6" />
                    <circle cx="12" cy="12" r="2.4" />
                    <path d="M12 3.4v6.2" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px" }}>GPS device</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", boxShadow: "var(--shadow-xs)" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                    <circle cx="12" cy="8" r="3.4" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px" }}>Customer portal</span>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(68,105,240,.05)", borderRadius: "18px", padding: "18px 16px 16px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "13px", paddingLeft: "2px" }}>Statutory filing</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", boxShadow: "var(--shadow-xs)" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M9 8h6M9 12h6M9 16h3" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px" }}>GST portal</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", boxShadow: "var(--shadow-xs)" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M9 8h6M9 12h6M9 16h3" />
                  </svg>
                  <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px" }}>E-way bill</span>
                </div>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "230px", display: "block" }}>
            <path d="M2 18 C40 18 58 50 98 50" fill="none" stroke="#4469F0" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 34 C40 34 58 50 98 50" fill="none" stroke="#6366F1" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 50 L98 50" fill="none" stroke="#2F58EE" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 66 C40 66 58 50 98 50" fill="none" stroke="#6366F1" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 82 C40 82 58 50 98 50" fill="none" stroke="#4469F0" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 18 C40 18 58 50 98 50" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 0s" }} />
            <path d="M2 34 C40 34 58 50 98 50" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 0.35s" }} />
            <path d="M2 50 L98 50" fill="none" stroke="#2F58EE" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 0.7s" }} />
            <path d="M2 66 C40 66 58 50 98 50" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 1.05s" }} />
            <path d="M2 82 C40 82 58 50 98 50" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 1.4s" }} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.30)", borderRadius: "16px", padding: "18px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", textAlign: "center", lineHeight: "17px" }}>Tracking</span>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.30)", borderRadius: "16px", padding: "18px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="18" r="2.5" />
                    <circle cx="18" cy="6" r="2.5" />
                    <path d="M8.5 18h5a4 4 0 0 0 4-4V8.5" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", textAlign: "center", lineHeight: "17px" }}>Dispatch</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "18px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l9 5-9 5-9-5 9-5z" />
                    <path d="M3 13l9 5 9-5" opacity=".55" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", textAlign: "center", lineHeight: "17px" }}>ERP</span>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "18px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
                    <path d="M8 3v18" opacity=".55" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", textAlign: "center", lineHeight: "17px" }}>Ledgers</span>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.16)", borderRadius: "16px", padding: "18px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: "var(--shadow-xs)" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
                  </svg>
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", textAlign: "center", lineHeight: "17px" }}>Reporting</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "180px", display: "block" }}>
            <path d="M2 30 C40 30 60 50 98 50" fill="none" stroke="#4469F0" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 50 L98 50" fill="none" stroke="#2F58EE" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 70 C40 70 60 50 98 50" fill="none" stroke="#6366F1" strokeOpacity=".26" strokeWidth="1.2" />
            <path d="M2 30 C40 30 60 50 98 50" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 0.2s" }} />
            <path d="M2 50 L98 50" fill="none" stroke="#2F58EE" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 0.6s" }} />
            <path d="M2 70 C40 70 60 50 98 50" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeDasharray="12 188" style={{ animation: "arch-flow 2.8s linear infinite 1s" }} />
          </svg>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ position: "relative", width: "82px", height: "82px" }}>
              <div style={{ position: "absolute", inset: "-22%", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.30), transparent 68%)", animation: "arch-orb 3.6s ease-in-out infinite" }} />
              <div style={{ position: "absolute", inset: "0", borderRadius: "22px", background: "linear-gradient(150deg, #4469F0 0%, #213EA7 100%)", boxShadow: "0 16px 40px rgba(68,105,240,.42)", display: "grid", placeItems: "center" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "26px", color: "#FFFFFF", letterSpacing: "-1px" }}>G</span>
              </div>
            </div>
          </div>
        </div>
        <p style={{ maxWidth: "820px", margin: "56px auto 0", textAlign: "center", fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", textWrap: "pretty" }}>Contract rates, dedicated vehicles and market hires all cost against the same record. Your client sees live tracking through their own portal, and the monthly service report builds itself from trips that already closed.</p>
      </div>
    </section>
  );
}
