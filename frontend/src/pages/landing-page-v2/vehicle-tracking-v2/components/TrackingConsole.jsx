export default function TrackingConsole() {
  return (
    <section data-screen-label="Tracking console" style={{ background: "#FFFFFF", padding: "104px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "72px", alignItems: "center" }}>
        <div data-reveal-group>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "38px", lineHeight: "1.12", letterSpacing: "-1.2px", margin: "0", textWrap: "pretty" }}>Built for the person watching the map all day.</h2>
          <p style={{ fontSize: "17px", lineHeight: "28px", color: "#5D5D5E", margin: "22px 0 32px" }}>Filters persist, the map remembers where you left it, and every vehicle opens straight into its trip, driver and consignment record.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>One click from a pin to the consignment it is carrying</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Share a live tracking link with the client, no login required</div>
            </div>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "3px" }}>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div style={{ fontSize: "16px", lineHeight: "25px", color: "#050816" }}>Replay any trip from the last 90 days, stop by stop</div>
            </div>
          </div>
        </div>
        <div data-reveal style={{ borderRadius: "var(--radius-xtra-soft)", overflow: "hidden", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", aspectRatio: "16/10" }}>
          <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF", fontFamily: "var(--font-ui)", color: "#050816" }}>
            <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid rgba(5,8,22,.07)", background: "#FCFCFD" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "6px", background: "var(--nova-rage-400)", display: "grid", placeItems: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: "600", letterSpacing: "-.1px", whiteSpace: "nowrap" }}>Live fleet</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "6px", flex: "0 0 auto", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "9px", fontWeight: "600", padding: "4px 9px", borderRadius: "999px", background: "var(--nova-rage-400)", color: "#FFFFFF" }}>All 44</span>
                <span style={{ fontSize: "9px", fontWeight: "500", padding: "4px 9px", borderRadius: "999px", background: "rgba(5,8,22,.05)", color: "#5D5D5E" }}>Moving 38</span>
                <span style={{ fontSize: "9px", fontWeight: "500", padding: "4px 9px", borderRadius: "999px", background: "rgba(5,8,22,.05)", color: "#5D5D5E" }}>Idle 4</span>
                <span style={{ fontSize: "9px", fontWeight: "500", padding: "4px 9px", borderRadius: "999px", background: "rgba(229,104,107,.12)", color: "#C4494C" }}>Halted 2</span>
              </span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "7px", padding: "5px 10px", borderRadius: "8px", border: "1px solid rgba(5,8,22,.09)", background: "#FFFFFF", flex: "0 1 140px", minWidth: "0", overflow: "hidden" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B6B6BC" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.4-3.4" />
                </svg>
                <span style={{ fontSize: "9.5px", color: "#B6B6BC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Vehicle, driver or LR</span>
              </span>
              <span style={{ width: "22px", height: "22px", borderRadius: "999px", background: "rgba(68,105,240,.14)", display: "grid", placeItems: "center", fontSize: "8.5px", fontWeight: "600", color: "var(--nova-rage-600)" }}>PK</span>
            </div>

            <div style={{ flex: "1", minHeight: "0", display: "flex" }}>
              <div style={{ flex: "0 0 168px", minWidth: "0", borderRight: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", background: "#FCFCFD" }}>
                <div style={{ padding: "8px 12px 5px", fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>On the road</div>
                <div style={{ flex: "1", minHeight: "0", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: "9px", padding: "7px 12px", background: "#FFFFFF", borderLeft: "2px solid var(--nova-rage-400)", borderTop: "1px solid rgba(5,8,22,.06)", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                    <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#187A32", marginTop: "4px" }} />
                    <span style={{ flex: "1", minWidth: "0" }}>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: "500" }}>GJ-05-KT-1180</span>
                      <span style={{ display: "block", fontSize: "9px", color: "#93939A", marginTop: "2px" }}>Surat → Nagpur · 62 km/h</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "9px", padding: "7px 12px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
                    <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#187A32", marginTop: "4px" }} />
                    <span style={{ flex: "1", minWidth: "0" }}>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#5D5D5E" }}>MH-04-BR-2210</span>
                      <span style={{ display: "block", fontSize: "9px", color: "#B6B6BC", marginTop: "2px" }}>Pune → Indore · 58 km/h</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "9px", padding: "7px 12px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
                    <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#E0A93B", marginTop: "4px" }} />
                    <span style={{ flex: "1", minWidth: "0" }}>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#5D5D5E" }}>RJ-14-GH-7745</span>
                      <span style={{ display: "block", fontSize: "9px", color: "#B6B6BC", marginTop: "2px" }}>Idle 24 min · Bhilwara</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "9px", padding: "7px 12px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
                    <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#E5686B", marginTop: "4px" }} />
                    <span style={{ flex: "1", minWidth: "0" }}>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#5D5D5E" }}>KA-51-MN-3390</span>
                      <span style={{ display: "block", fontSize: "9px", color: "#C4494C", marginTop: "2px" }}>Halted 2 h 10 m</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "9px", padding: "7px 12px", borderBottom: "1px solid rgba(5,8,22,.05)" }}>
                    <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#187A32", marginTop: "4px" }} />
                    <span style={{ flex: "1", minWidth: "0" }}>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#5D5D5E" }}>TN-22-CD-1904</span>
                      <span style={{ display: "block", fontSize: "9px", color: "#B6B6BC", marginTop: "2px" }}>Hosur → Chennai · 51 km/h</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ flex: "1 1 auto", minWidth: "150px", position: "relative", background: "#EEF1F8", overflow: "hidden" }}>
                <svg viewBox="0 0 280 360" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
                  <rect width="280" height="360" fill="#EEF1F8" />
                  <path d="M-10 88 H290 M-10 186 H290 M-10 286 H290 M70 -10 V370 M176 -10 V370" stroke="rgba(5,8,22,.05)" strokeWidth="1" />
                  <path d="M-10 246 C56 238 84 196 132 182 C186 166 214 118 290 108" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                  <path d="M52 370 C64 292 106 258 122 196 C138 132 178 96 190 -10" fill="none" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
                  <path d="M-10 62 C64 54 96 82 152 68 C204 55 236 66 290 52" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M34 322 C74 288 88 252 124 232 C168 208 176 152 216 66" fill="none" stroke="#4469F0" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="7 6" style={{ animation: "ai-flow 1.6s linear infinite" }} />
                  <circle cx="34" cy="322" r="5" fill="#FFFFFF" stroke="#4469F0" strokeWidth="2.6" />
                  <circle cx="216" cy="66" r="5" fill="#4469F0" />
                  <circle cx="70" cy="128" r="4.2" fill="#187A32" />
                  <circle cx="228" cy="266" r="4.2" fill="#E0A93B" />
                  <circle cx="122" cy="318" r="4.2" fill="#E5686B" />
                  <g>
                    <circle cx="150" cy="198" r="12" fill="rgba(68,105,240,.30)" style={{ transformOrigin: "150px 198px", animation: "vt-ping 2.2s cubic-bezier(.2,0,0,1) infinite" }} />
                    <circle cx="150" cy="198" r="6.8" fill="#4469F0" stroke="#FFFFFF" strokeWidth="2.4" />
                  </g>
                </svg>
                <div style={{ position: "absolute", left: "12px", top: "11px", display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "999px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(5,8,22,.07)", boxShadow: "0 4px 14px rgba(30,34,56,.10)" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#187A32", animation: "ai-blip 1.8s ease-in-out infinite" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#5D5D5E" }}>live · 30 s ping</span>
                </div>
                <div style={{ position: "absolute", left: "54%", top: "calc(55% + 16px)", transform: "translateX(-50%)", whiteSpace: "nowrap", padding: "7px 10px", borderRadius: "9px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", boxShadow: "0 8px 22px rgba(30,34,56,.16)" }}>
                  <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: "500" }}>GJ-05-KT-1180</span>
                  <span style={{ display: "block", fontSize: "8.5px", color: "#93939A", marginTop: "2px" }}>62 km/h · ETA 14:20</span>
                </div>
                <div style={{ position: "absolute", right: "10px", top: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "7px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.09)", display: "grid", placeItems: "center", fontSize: "13px", color: "#5D5D5E", lineHeight: "1" }}>+</span>
                  <span style={{ width: "24px", height: "24px", borderRadius: "7px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.09)", display: "grid", placeItems: "center", fontSize: "13px", color: "#5D5D5E", lineHeight: "1" }}>−</span>
                </div>
              </div>

              <div style={{ flex: "0 0 188px", minWidth: "0", borderLeft: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
                <div style={{ padding: "10px 13px 9px", borderBottom: "1px solid rgba(5,8,22,.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: "500" }}>GJ-05-KT-1180</span>
                    <span style={{ fontSize: "8.5px", fontWeight: "600", padding: "3px 8px", borderRadius: "999px", background: "rgba(24,122,50,.10)", color: "#187A32" }}>moving</span>
                  </div>
                  <div style={{ fontSize: "9px", color: "#93939A", marginTop: "3px" }}>Tata Signa 4825 · 32 ft MXL</div>
                </div>
                <div style={{ flex: "1 1 auto", minHeight: "0", overflow: "hidden", padding: "9px 13px", display: "flex", flexDirection: "column", gap: "0" }}>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)" }}>
                    <span style={{ fontSize: "9.5px", color: "#5D5D5E" }}>Consignment</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px" }}>CN-40224</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)" }}>
                    <span style={{ fontSize: "9.5px", color: "#5D5D5E" }}>Driver</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px" }}>R. Sharma</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)" }}>
                    <span style={{ fontSize: "9.5px", color: "#5D5D5E" }}>Distance</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px" }}>412 of 588 km</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid rgba(5,8,22,.055)" }}>
                    <span style={{ fontSize: "9.5px", color: "#5D5D5E" }}>E-way bill</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "#187A32" }}>valid 3 d</span>
                  </span>
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Progress</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#5D5D5E" }}>70 %</span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "999px", background: "rgba(5,8,22,.07)", overflow: "hidden" }}>
                      <div style={{ width: "70%", height: "100%", borderRadius: "999px", background: "var(--nova-rage-400)" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "7px" }}>
                    <span style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ flex: "0 0 auto", width: "6px", height: "6px", borderRadius: "999px", background: "#4469F0", marginTop: "4px" }} />
                      <span style={{ flex: "1", minWidth: "0" }}>
                        <span style={{ display: "block", fontSize: "9.5px" }}>Bharuch toll crossed</span>
                        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "8.5px", color: "#B6B6BC" }}>11:42</span>
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ flex: "0 0 auto", width: "6px", height: "6px", borderRadius: "999px", background: "rgba(5,8,22,.18)", marginTop: "4px" }} />
                      <span style={{ flex: "1", minWidth: "0" }}>
                        <span style={{ display: "block", fontSize: "9.5px", color: "#5D5D5E" }}>Halt at Dhule dhaba</span>
                        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "8.5px", color: "#B6B6BC" }}>09:05 · 38 min</span>
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ flex: "0 0 auto", padding: "10px 13px", borderTop: "1px solid rgba(5,8,22,.06)", display: "flex", gap: "7px" }}>
                  <span style={{ flex: "1", textAlign: "center", fontSize: "9.5px", fontWeight: "600", color: "#FFFFFF", background: "var(--nova-rage-400)", borderRadius: "7px", padding: "7px 0" }}>Share link</span>
                  <span style={{ flex: "1", textAlign: "center", fontSize: "9.5px", fontWeight: "600", color: "#050816", border: "1px solid rgba(5,8,22,.10)", borderRadius: "7px", padding: "7px 0" }}>Replay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
