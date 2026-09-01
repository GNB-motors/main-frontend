export default function Hero() {
  return (
    <section id="top" data-screen-label="Hero" style={{ position: "relative", background: "#F4F5FA", padding: "104px 40px" }}>
      <div data-hero-grid style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) 620px", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "62px", lineHeight: "1.06", letterSpacing: "-2.2px", color: "#050816", margin: "0", textWrap: "pretty" }}>
            The unified{' '}
            <span style={{ color: "var(--nova-rage-400)" }}>AI-native</span>
            {' '}platform for fleet operations.
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "30px", color: "#5D5D5E", margin: "30px 0 0", maxWidth: "560px", textWrap: "pretty" }}>From GPS telemetry and trip dispatch to GST, e-way bills, ledgers, payments and reporting, GNB Edge brings every part of fleet operations together on one intelligent platform, on web, mobile and API, built for single owners, contract fleets and enterprise networks alike.</p>
          <div style={{ display: "flex", gap: "32px", alignItems: "center", marginTop: "44px" }}>
            <a href="#demo" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", padding: "18px 44px", borderRadius: "999px", transition: "background 200ms cubic-bezier(.2,0,0,1)" }}>Reach us</a>
            <a href="#platform" style={{ fontFamily: "var(--font-ui)", fontSize: "16px", fontWeight: "600", color: "#050816", display: "flex", alignItems: "center", gap: "9px" }}>
              See the platform{' '}
              <span style={{ color: "var(--nova-rage-400)" }}>→</span>
            </a>
          </div>
        </div>

        <div data-reveal data-hero-mosaic style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 196px)", gap: "16px", alignItems: "start", width: "620px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "0px" }}>
              <div data-swapslot style={{ position: "relative", height: "182px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite 0s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Fleet live</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>30 s refresh</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "7px", minWidth: "0", overflow: "hidden", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite 0s" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "30px", letterSpacing: "-1.3px" }}>38</span>
                      <span style={{ fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>of 44 moving</span>
                    </div>
                    <svg viewBox="0 0 212 46" preserveAspectRatio="none" style={{ width: "100%", height: "46px", display: "block", overflow: "visible" }}>
                      <path d="M2 36 C32 31 48 19 76 20 C110 21 128 10 162 11 C186 12 198 7 210 6" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" style={{ '--d': "232", strokeDasharray: "232", animation: "tile-draw 24s cubic-bezier(.2,0,0,1) infinite 0s" }} />
                      <circle cx="210" cy="6" r="3.4" fill="#4469F0" style={{ opacity: "0", transformOrigin: "210px 6px", animation: "tile-pop 24s cubic-bezier(.2,0,0,1) infinite 2.4s" }} />
                    </svg>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -12s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Party ledger</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>Shree Traders</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -12s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Invoiced</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>₹6.41L</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -11.7066666667s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Received</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>₹1.59L</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", paddingTop: "9px", borderTop: "1px solid rgba(5,8,22,.09)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -11.2s" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: "600" }}>Balance</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.7px", color: "var(--nova-rage-600)" }}>₹4.82L</span>
                    </div>
                  </div>
                </div>
              </div>
              <div data-swapslot style={{ position: "relative", height: "202px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -4s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Fuel gap</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>audit raised</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", height: "19px" }}>
                        <span style={{ flex: "1", height: "100%", borderRadius: "5px", background: "rgba(68,105,240,.42)", transformOrigin: "left", animation: "tile-bar 24s cubic-bezier(.2,0,0,1) infinite -4s" }} />
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", height: "19px", transformOrigin: "left", animation: "tile-bar 24s cubic-bezier(.2,0,0,1) infinite -3.5733333333s" }}>
                        <span style={{ flex: "0 0 84%", height: "100%", borderRadius: "5px", background: "rgba(68,105,240,.20)" }} />
                        <span style={{ flex: "1", height: "100%", borderRadius: "5px", background: "repeating-linear-gradient(135deg, rgba(229,104,107,.36) 0 4px, rgba(229,104,107,.12) 4px 8px)" }} />
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", minWidth: "0", overflow: "hidden", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -2.88s" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "24px", letterSpacing: "-.9px", color: "#C4494C", whiteSpace: "nowrap" }}>25.6 L</span>
                      <span style={{ fontSize: "10.5px", color: "#93939A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>unaccounted</span>
                    </div>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -16s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Proof of delivery</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>signed 12:41</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <svg viewBox="0 0 200 48" preserveAspectRatio="none" style={{ width: "100%", height: "48px", display: "block", overflow: "visible" }}>
                      <path d="M8 38 C24 8 34 42 48 26 C62 10 70 36 86 20 C102 4 112 32 130 22 C146 14 156 26 168 18 C178 12 186 20 194 14" fill="none" stroke="#050816" strokeWidth="1.8" strokeLinecap="round" style={{ '--d': "330", strokeDasharray: "330", animation: "tile-draw 24s cubic-bezier(.2,0,0,1) infinite -16s" }} />
                    </svg>
                    <div style={{ display: "flex", gap: "7px" }}>
                      <span style={{ flex: "1", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#5D5D5E", padding: "6px 0", textAlign: "center", borderRadius: "7px", background: "#F4F5FA", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -14s" }}>2 photos</span>
                      <span style={{ flex: "1", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#5D5D5E", padding: "6px 0", textAlign: "center", borderRadius: "7px", background: "#F4F5FA", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -13.6533333333s" }}>GPS stamped</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "30px" }}>
              <div data-swapslot style={{ position: "relative", height: "210px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -8s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Trip record</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>CN-40224</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -8s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Vehicle</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>GJ-05-KT-1180</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -7.7066666667s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Driver</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>R. Sharma</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -7.4133333333s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Distance</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>588 km</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -6.9333333333s" }}>
                      <span style={{ fontSize: "9px", fontWeight: "600", padding: "3px 9px", borderRadius: "999px", background: "rgba(68,105,240,.12)", color: "var(--nova-rage-600)", whiteSpace: "nowrap" }}>in transit</span>
                      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#5D5D5E", whiteSpace: "nowrap" }}>
                        e-way{' '}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" style={{ '--d': "24", strokeDasharray: "24", animation: "tile-draw 24s cubic-bezier(.2,0,0,1) infinite -6.5333333333s" }} />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -20s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Service due</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>2 vehicles</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -20s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>MH-04-BR-2210</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>4,120 km over</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -19.7066666667s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>GJ-05-KT-1180</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>due in 3 days</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", minWidth: "0", overflow: "hidden", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -19.2s" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "24px", letterSpacing: "-.9px", color: "#C4494C", whiteSpace: "nowrap" }}>₹41,200</span>
                      <span style={{ fontSize: "10.5px", color: "#93939A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>held up</span>
                    </div>
                  </div>
                </div>
              </div>
              <div data-swapslot style={{ position: "relative", height: "182px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "linear-gradient(150deg, #2F58EE 0%, #213EA7 100%)", border: "1px solid rgba(146,168,255,.4)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.72)", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>AI recovery</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", flex: "0 0 auto" }}>this quarter</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", opacity: "0", animation: "tile-pop 24s cubic-bezier(.2,0,0,1) infinite -2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                      </svg>
                    </span>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "28px", letterSpacing: "-1.1px", color: "#FFFFFF", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -1.52s" }}>₹2.93L</div>
                      <div style={{ fontSize: "10.5px", lineHeight: "16px", color: "rgba(255,255,255,.8)", marginTop: "5px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -1.1466666667s" }}>recoverable across 6 routes, found by AI</div>
                    </div>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -14s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Mileage drift</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>−13 %</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <svg viewBox="0 0 212 76" preserveAspectRatio="none" style={{ width: "100%", height: "76px", display: "block", overflow: "visible" }}>
                      <path d="M0 20 H212 M0 48 H212" stroke="rgba(5,8,22,.06)" strokeWidth="1" />
                      <path d="M4 22 L44 27 L84 21 L124 38 L164 54 L208 62" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ '--d': "230", strokeDasharray: "230", animation: "tile-draw 24s cubic-bezier(.2,0,0,1) infinite -14s" }} />
                      <circle cx="208" cy="62" r="3.4" fill="#E5686B" style={{ opacity: "0", transformOrigin: "208px 62px", animation: "tile-pop 24s cubic-bezier(.2,0,0,1) infinite -11.6s" }} />
                    </svg>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -11.3333333333s" }}>
                      <span style={{ fontSize: "10.5px", color: "#93939A" }}>billed 4.0 km/l</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--nova-rage-600)" }}>sensor 4.6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "12px" }}>
              <div data-swapslot style={{ position: "relative", height: "188px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -6s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Live route</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>ETA 14:20</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ flex: "1", minHeight: "0", borderRadius: "10px", background: "#F1F3FA", position: "relative", overflow: "hidden" }}>
                      <svg viewBox="0 0 212 110" preserveAspectRatio="none" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                        <path d="M0 28 H212 M0 62 H212 M52 0 V110 M148 0 V110" stroke="rgba(5,8,22,.05)" strokeWidth="1" />
                        <path d="M18 92 C58 78 52 50 96 42 C136 35 152 22 196 16" fill="none" stroke="#4469F0" strokeWidth="2.4" strokeLinecap="round" style={{ '--d': "215", strokeDasharray: "215", animation: "tile-draw 24s cubic-bezier(.2,0,0,1) infinite -6s" }} />
                        <circle cx="18" cy="92" r="4" fill="#FFFFFF" stroke="#4469F0" strokeWidth="2.4" />
                        <circle cx="96" cy="42" r="8" fill="rgba(68,105,240,.18)" style={{ transformOrigin: "96px 42px", animation: "tile-ping 2.4s cubic-bezier(.2,0,0,1) infinite" }} />
                        <circle cx="96" cy="42" r="3.6" fill="#4469F0" />
                        <circle cx="196" cy="16" r="4" fill="#4469F0" style={{ opacity: "0", transformOrigin: "196px 16px", animation: "tile-pop 24s cubic-bezier(.2,0,0,1) infinite -3.4666666667s" }} />
                      </svg>
                    </div>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -18s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>E-way bill</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>ack 3521</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: "500", letterSpacing: ".5px", whiteSpace: "nowrap", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -18s" }}>7418 2291</span>
                      <span style={{ flex: "0 0 auto", width: "24px", height: "24px", borderRadius: "999px", background: "rgba(24,122,50,.10)", display: "grid", placeItems: "center", opacity: "0", animation: "tile-pop 24s cubic-bezier(.2,0,0,1) infinite -17.0666666667s" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#187A32" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#93939A", lineHeight: "16px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -16.6666666667s" }}>
                      HSN 9965 · MP 23<br />filed 06:13 · valid 3 days
                    </div>
                  </div>
                </div>
              </div>
              <div data-swapslot style={{ position: "relative", height: "196px" }}>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -10s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Roster today</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>4 on duty</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -10s" }}>
                        <span style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(68,105,240,.14)", display: "grid", placeItems: "center", fontSize: "8.5px", fontWeight: "600", color: "var(--nova-rage-600)" }}>RS</span>
                        <span style={{ flex: "1", fontSize: "10.5px", fontWeight: "500" }}>Ravi S.</span>
                        <span style={{ fontSize: "8.5px", fontWeight: "600", padding: "3px 7px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "#187A32", whiteSpace: "nowrap" }}>free</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.7333333333s" }}>
                        <span style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(5,8,22,.06)", display: "grid", placeItems: "center", fontSize: "8.5px", fontWeight: "600", color: "#5D5D5E" }}>AK</span>
                        <span style={{ flex: "1", fontSize: "10.5px", fontWeight: "500" }}>Anil K.</span>
                        <span style={{ fontSize: "8.5px", fontWeight: "600", padding: "3px 7px", borderRadius: "999px", background: "rgba(229,104,107,.13)", color: "#C4494C", whiteSpace: "nowrap" }}>docs expired</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.4666666667s" }}>
                        <span style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(5,8,22,.06)", display: "grid", placeItems: "center", fontSize: "8.5px", fontWeight: "600", color: "#5D5D5E" }}>SP</span>
                        <span style={{ flex: "1", fontSize: "10.5px", fontWeight: "500" }}>Suresh P.</span>
                        <span style={{ fontSize: "8.5px", fontWeight: "600", padding: "3px 7px", borderRadius: "999px", background: "rgba(68,105,240,.12)", color: "var(--nova-rage-600)", whiteSpace: "nowrap" }}>on trip</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -9.2s" }}>
                        <span style={{ flex: "0 0 auto", width: "22px", height: "22px", borderRadius: "999px", background: "rgba(5,8,22,.06)", display: "grid", placeItems: "center", fontSize: "8.5px", fontWeight: "600", color: "#5D5D5E" }}>MJ</span>
                        <span style={{ flex: "1", fontSize: "10.5px", fontWeight: "500" }}>Mahesh J.</span>
                        <span style={{ fontSize: "8.5px", fontWeight: "600", padding: "3px 7px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "#187A32", whiteSpace: "nowrap" }}>free</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div data-swaptile style={{ position: "absolute", inset: "0", boxSizing: "border-box", borderRadius: "16px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 12px 32px rgba(30,34,56,.13)", padding: "14px 15px 15px", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "none", opacity: "0", willChange: "opacity, transform", animation: "hero-swap 24s cubic-bezier(.2,0,0,1) infinite -22s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", whiteSpace: "nowrap", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis" }}>Driver advance</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", flex: "0 0 auto" }}>settled 09:20</span>
                  </div>
                  <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -22s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Issued</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>₹8,000</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -21.7066666667s" }}>
                        <span style={{ fontSize: "10.5px", color: "#5D5D5E" }}>Spent on trip</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#050816" }}>₹6,350</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", paddingTop: "9px", borderTop: "1px solid rgba(5,8,22,.09)", opacity: "0", animation: "tile-rise 24s cubic-bezier(.2,0,0,1) infinite -21.2s" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: "600" }}>Returned</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "19px", letterSpacing: "-.7px", color: "#187A32" }}>₹1,650</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
