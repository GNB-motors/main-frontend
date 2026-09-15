export default function CustomerArchitecture() {
  return (
    <section data-screen-label="Customer architecture" style={{ background: "#FFFFFF", padding: "112px 40px" }}>
      <div data-reveal style={{ maxWidth: "900px", margin: "0 auto 64px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "11px", fontWeight: "500", letterSpacing: ".44em", textTransform: "uppercase", color: "var(--nova-rage-600)", marginBottom: "20px" }}>System architecture</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "44px", lineHeight: "1.08", letterSpacing: "-1.5px", margin: "0", textWrap: "pretty" }}>
          Configured around your operation,{' '}
          <span style={{ color: "var(--nova-rage-400)" }}>not the other way round.</span>
        </h2>
      </div>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div data-reveal style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
              <path d="M9.5 12l1.8 1.8 3.4-3.4" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Personalized
              <br />
              configuration
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 7h3M8 11h3M13 7h3M13 11h3M9 21v-5h6v5" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Every depot
              <br />
              every entity
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              Multi-entity
              <br />
              and multi-GSTIN
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "12px 18px", borderRadius: "12px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-xs)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <rect x="4.5" y="10" width="15" height="10" rx="2" />
              <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
            </svg>
            <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".14em", textTransform: "uppercase", color: "#050816", lineHeight: "15px" }}>
              SSO, audit
              <br />
              and residency
            </span>
          </div>
        </div>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "20px", padding: "22px 24px 24px", boxShadow: "var(--shadow-xs)", animation: "ly-000 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Layer 1 · Your channels</div>
              <div style={{ fontSize: "13px", color: "#93939A", letterSpacing: "-.1px" }}>The devices and systems you already run</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-006 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.00s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Driver app</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-017 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.18s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>GPS devices</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-028 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.36s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Customer portal</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-039 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.54s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Your ERP</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-050 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.72s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>GST portal</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 15px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-xs)", animation: "it-061 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.90s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>E-way bill</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "58px", display: "block", transformOrigin: "top", overflow: "visible", animation: "cd-090 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <path d="M14 2 L14 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M28.4 2 L28.4 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M42.8 2 L42.8 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M57.2 2 L57.2 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M71.6 2 L71.6 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M86 2 L86 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M14 2 L14 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 1.30s" }} />
            <path d="M28.4 2 L28.4 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 1.60s" }} />
            <path d="M42.8 2 L42.8 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 1.90s" }} />
            <path d="M57.2 2 L57.2 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 2.20s" }} />
            <path d="M71.6 2 L71.6 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 2.50s" }} />
            <path d="M86 2 L86 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 2.80s" }} />
          </svg>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "20px", padding: "22px 24px 24px", boxShadow: "var(--shadow-xs)", animation: "ly-115 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Layer 2 · Your configuration</div>
              <div style={{ fontSize: "13px", color: "#93939A", letterSpacing: "-.1px" }}>Defined with your team, not preset by us</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-130 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.40s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Custom fields</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-140 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.58s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Roles and permissions</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-150 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.76s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Approval rules</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-160 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 0.94s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Report builder</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-170 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 1.12s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Rate and contract logic</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 15px", borderRadius: "999px", background: "rgba(68,105,240,.06)", border: "1px solid rgba(68,105,240,.18)", animation: "it-180 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "var(--nova-rage-400)", flex: "0 0 auto", animation: "dot-pulse 2.4s ease-in-out 1.30s infinite" }} />
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>API and webhooks</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "58px", display: "block", transformOrigin: "top", overflow: "visible", animation: "cd-200 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <path d="M14 2 L14 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M28.4 2 L28.4 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M42.8 2 L42.8 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M57.2 2 L57.2 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M71.6 2 L71.6 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M86 2 L86 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M14 2 L14 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 2.40s" }} />
            <path d="M28.4 2 L28.4 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 2.70s" }} />
            <path d="M42.8 2 L42.8 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 3.00s" }} />
            <path d="M57.2 2 L57.2 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 3.30s" }} />
            <path d="M71.6 2 L71.6 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 3.60s" }} />
            <path d="M86 2 L86 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 3.90s" }} />
          </svg>
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(68,105,240,.18)", borderRadius: "20px", padding: "22px 24px 24px", boxShadow: "var(--shadow-xs)", animation: "ly-225 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "10px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "var(--nova-rage-600)" }}>Layer 3 · Your module shelf</div>
              <div style={{ fontSize: "13px", color: "#93939A", letterSpacing: "-.1px" }}>Switch on only what this entity needs</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "var(--shadow-xs)", animation: "it-240 8s cubic-bezier(.2,0,0,1) infinite both, pg-295 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative", flex: "0 0 auto", animation: "tk-295 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF", transform: "translateX(11px)", animation: "kb-295 8s cubic-bezier(.2,0,0,1) infinite both" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Vehicle tracking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "var(--shadow-xs)", animation: "it-249 8s cubic-bezier(.2,0,0,1) infinite both, pg-308 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative", flex: "0 0 auto", animation: "tk-308 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF", transform: "translateX(11px)", animation: "kb-308 8s cubic-bezier(.2,0,0,1) infinite both" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Trip management</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "var(--shadow-xs)", animation: "it-258 8s cubic-bezier(.2,0,0,1) infinite both, pg-321 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative", flex: "0 0 auto", animation: "tk-321 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF", transform: "translateX(11px)", animation: "kb-321 8s cubic-bezier(.2,0,0,1) infinite both" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Driver management</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "var(--shadow-xs)", animation: "it-267 8s cubic-bezier(.2,0,0,1) infinite both, pg-334 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative", flex: "0 0 auto", animation: "tk-334 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF", transform: "translateX(11px)", animation: "kb-334 8s cubic-bezier(.2,0,0,1) infinite both" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Fuel and mileage</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.12)", boxShadow: "var(--shadow-xs)", animation: "it-276 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "rgba(5,8,22,.14)", position: "relative", flex: "0 0 auto" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#93939A", whiteSpace: "nowrap" }}>Ledgers</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.12)", boxShadow: "var(--shadow-xs)", animation: "it-285 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "rgba(5,8,22,.14)", position: "relative", flex: "0 0 auto" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "500", letterSpacing: "-.1px", color: "#93939A", whiteSpace: "nowrap" }}>Maintenance</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(68,105,240,.28)", boxShadow: "var(--shadow-xs)", animation: "it-294 8s cubic-bezier(.2,0,0,1) infinite both, pg-347 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                <span style={{ width: "26px", height: "15px", borderRadius: "999px", background: "var(--nova-rage-400)", position: "relative", flex: "0 0 auto", animation: "tk-347 8s cubic-bezier(.2,0,0,1) infinite both" }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "11px", height: "11px", borderRadius: "999px", background: "#FFFFFF", transform: "translateX(11px)", animation: "kb-347 8s cubic-bezier(.2,0,0,1) infinite both" }} />
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "-.1px", color: "#050816", whiteSpace: "nowrap" }}>Reporting</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "64px", display: "block", transformOrigin: "top", overflow: "visible", animation: "cd-350 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <path d="M14 2 C14 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M38 2 C38 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M62 2 C62 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M86 2 C86 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeOpacity=".22" strokeWidth="1.2" />
            <path d="M14 2 C14 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 3.90s" }} />
            <path d="M38 2 C38 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 4.20s" }} />
            <path d="M62 2 C62 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 4.50s" }} />
            <path d="M86 2 C86 48 50 52 50 98" fill="none" vectorEffect="non-scaling-stroke" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 194" style={{ animation: "arch-flow 2.6s linear infinite 4.80s" }} />
          </svg>
          <div style={{ display: "flex", justifyContent: "center", animation: "co-420 8s cubic-bezier(.2,0,0,1) infinite both" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px", padding: "20px 34px 20px 24px", borderRadius: "22px", background: "linear-gradient(150deg, #4469F0 0%, #213EA7 100%)", animation: "cg-420 8s cubic-bezier(.2,0,0,1) infinite both" }}>
              <div style={{ position: "absolute", inset: "-14%", borderRadius: "999px", background: "radial-gradient(circle, rgba(68,105,240,.34), transparent 68%)", pointerEvents: "none", animation: "ch-420 8s cubic-bezier(.2,0,0,1) infinite both" }} />
              <span style={{ position: "relative", width: "46px", height: "46px", borderRadius: "14px", background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "20px", color: "#FFFFFF", letterSpacing: "-1px" }}>G</span>
              <span style={{ position: "relative" }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: "500", fontSize: "19px", color: "#FFFFFF", letterSpacing: "-.4px" }}>GNB Edge core</span>
                <span style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,.76)", marginTop: "4px" }}>One record, one audit trail, every entity</span>
              </span>
            </div>
          </div>
        </div>
        <p style={{ maxWidth: "820px", margin: "56px auto 0", textAlign: "center", fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", textWrap: "pretty" }}>No two enterprise fleets are set up the same way, so nothing here ships as a fixed template. Your fields, roles, approval rules, rate logic and reports are configured with your team, and each entity switches on only the modules it needs. Everything still writes to one record with one audit trail.</p>
      </div>
    </section>
  );
}
