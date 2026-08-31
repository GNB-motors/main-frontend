export default function MapConsole() {
  return (
    <section data-screen-label="Map console" style={{ background: "#FFFFFF", padding: "96px 40px 104px" }}>
      <div data-reveal style={{ maxWidth: "1280px", margin: "0 auto", borderRadius: "24px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", padding: "0 20px", height: "66px", borderBottom: "1px solid rgba(5,8,22,.07)", background: "#FCFCFE" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#187A32", boxShadow: "0 0 0 4px rgba(24,122,50,.14)", animation: "fm-blink 2.4s ease-in-out infinite" }} />
            <span style={{ fontSize: "15px", fontWeight: "600", letterSpacing: "-.2px" }}>Live fleet map</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#93939A" }}>1,240 vehicles</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", marginLeft: "8px", padding: "9px 14px", borderRadius: "10px", background: "#F3F3F6", border: "1px solid rgba(5,8,22,.06)", minWidth: "230px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93939A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" />
            </svg>
            <span style={{ fontSize: "13px", color: "#93939A" }}>Search vehicle, driver or trip</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", fontSize: "12.5px", fontWeight: "600", color: "#FFFFFF" }}>All</span>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)", fontSize: "12.5px", fontWeight: "500", color: "#5D5D5E" }}>Moving</span>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)", fontSize: "12.5px", fontWeight: "500", color: "#5D5D5E" }}>Halted</span>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)", fontSize: "12.5px", fontWeight: "500", color: "#5D5D5E" }}>Idle</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "#93939A" }}>updated 3 s ago</span>
            <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#F3F3F6", border: "1px solid rgba(5,8,22,.06)", display: "grid", placeItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5D5D5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l9 5-9 5-9-5 9-5z" />
                <path d="M3 13l9 5 9-5" />
              </svg>
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "268px 1fr 312px", height: "560px" }}>
          <div style={{ borderRight: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", minWidth: "0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
              <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9.5px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Vehicles on map</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A" }}>1,240</span>
            </div>
            <div style={{ flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px 13px 16px", borderLeft: "2px solid var(--nova-rage-400)", background: "rgba(68,105,240,.06)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>MH-12-AB-4471</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ramesh Pawar · Bhiwandi → Nagpur</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--nova-rage-600)", whiteSpace: "nowrap" }}>62 km/h</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px 13px 18px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>GJ-01-KV-8830</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Iqbal Shaikh · Surat → Mumbai</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>54 km/h</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#E5686B", animation: "fm-blink 1.8s ease-in-out infinite" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>MP-09-HT-2214</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Suresh Yadav · halted 47 min</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#C4494C", whiteSpace: "nowrap" }}>0 km/h</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>KA-05-MR-6612</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Vinod Kumar · Hosur → Chennai</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>71 km/h</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#F9A061" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>UP-32-CN-1907</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Anil Verma · idling at Lucknow depot</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>idle</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 18px", borderTop: "1px solid rgba(5,8,22,.05)" }}>
                <span style={{ flex: "0 0 auto", width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0" }} />
                <div style={{ minWidth: "0", flex: "1" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#050816" }}>WB-19-DA-5540</div>
                  <div style={{ fontSize: "11.5px", color: "#5D5D5E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Prakash Das · Kolkata → Bhubaneswar</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", whiteSpace: "nowrap" }}>58 km/h</span>
              </div>
              <div style={{ marginTop: "auto", padding: "14px 18px", borderTop: "1px solid rgba(5,8,22,.07)", background: "#FCFCFE" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--nova-rage-600)" }}>Open full vehicle list →</span>
              </div>
            </div>
          </div>
          <div style={{ position: "relative", background: "#F7F8FC", minWidth: "0" }}>
            <iframe src="/landing-v2/fleet-map-live.html" title="Live fleet map across India" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", border: "0", display: "block" }} />
            <div style={{ position: "absolute", top: "16px", left: "16px", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(5,8,22,.07)", boxShadow: "var(--shadow-sm)", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginBottom: "10px" }}>Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#4469F0" }} />
                  <span style={{ fontSize: "11.5px", color: "#050816" }}>Moving</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#E5686B" }} />
                  <span style={{ fontSize: "11.5px", color: "#050816" }}>Halted</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#F9A061" }} />
                  <span style={{ fontSize: "11.5px", color: "#050816" }}>Idle</span>
                </span>
              </div>
            </div>
            <div style={{ position: "absolute", top: "16px", right: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-xs)", display: "grid", placeItems: "center", fontSize: "16px", color: "#5D5D5E" }}>+</span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-xs)", display: "grid", placeItems: "center", fontSize: "16px", color: "#5D5D5E" }}>−</span>
              <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(5,8,22,.08)", boxShadow: "var(--shadow-xs)", display: "grid", placeItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5D5D5E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="7.5" />
                  <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
                </svg>
              </span>
            </div>
            <div style={{ position: "absolute", left: "16px", bottom: "16px", display: "flex", alignItems: "center", gap: "9px", padding: "10px 14px", borderRadius: "12px", background: "rgba(255,255,255,.94)", border: "1px solid rgba(68,105,240,.22)", boxShadow: "var(--shadow-sm)", backdropFilter: "blur(8px)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
                <circle cx="12" cy="12" r="8.5" strokeDasharray="3 4" />
                <circle cx="12" cy="12" r="2.6" />
              </svg>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#050816", whiteSpace: "nowrap" }}>Geofence · Bhiwandi ICD</span>
            </div>
            <div style={{ position: "absolute", right: "16px", bottom: "16px", display: "flex", alignItems: "center", gap: "9px", padding: "10px 14px", borderRadius: "12px", background: "rgba(46,20,26,.86)", border: "1px solid rgba(229,104,107,.34)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#E5686B", animation: "fm-blink 1.8s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,.9)", whiteSpace: "nowrap" }}>MP-09-HT-2214 · halt 47 min</span>
            </div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(5,8,22,.07)", display: "flex", flexDirection: "column", minWidth: "0", background: "#FCFCFE" }}>
            <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "#050816" }}>MH-12-AB-4471</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "999px", background: "rgba(68,105,240,.10)" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "999px", background: "#4469F0" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--nova-rage-600)" }}>moving</span>
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "8px" }}>Trip GNB/2026/04817 · 32 t tipper</div>
            </div>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(5,8,22,.07)", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ flex: "0 0 auto", width: "38px", height: "38px", borderRadius: "999px", background: "rgba(68,105,240,.10)", display: "grid", placeItems: "center", fontSize: "13px", fontWeight: "600", color: "var(--nova-rage-600)" }}>RP</span>
              <div style={{ minWidth: "0", flex: "1" }}>
                <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#050816" }}>Ramesh Pawar</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#93939A", marginTop: "3px" }}>DL-1420110012345 · 4 yrs</div>
              </div>
              <span style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.08)", display: "grid", placeItems: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4469F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 5 5L14.5 12l4 1.5V17a2 2 0 0 1-2.2 2A14 14 0 0 1 3.2 6.2 2 2 0 0 1 5 4z" />
                </svg>
              </span>
            </div>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(5,8,22,.07)" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#4469F0" }} />
                  <span style={{ flex: "1", width: "1px", margin: "5px 0", background: "repeating-linear-gradient(180deg, rgba(68,105,240,.4) 0 4px, transparent 4px 8px)" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "999px", border: "2px solid #4469F0", background: "#FFFFFF" }} />
                </div>
                <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#050816" }}>Bhiwandi ICD</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A", marginTop: "3px" }}>out 04:20 · 12 Aug</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#050816" }}>Nagpur depot</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A", marginTop: "3px" }}>eta 19:40 · 12 Aug</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A" }}>Trip progress</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--nova-rage-600)" }}>68% · 476 of 700 km</span>
                </div>
                <div style={{ height: "6px", borderRadius: "999px", background: "rgba(68,105,240,.12)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "68%", borderRadius: "999px", background: "linear-gradient(90deg, #4469F0, #213EA7)" }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(5,8,22,.07)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "11px 13px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)" }}>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Speed</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "#050816", marginTop: "6px" }}>62 km/h</div>
              </div>
              <div style={{ padding: "11px 13px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)" }}>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Odometer</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "#050816", marginTop: "6px" }}>4,18,240</div>
              </div>
              <div style={{ padding: "11px 13px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)" }}>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Mileage</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "#050816", marginTop: "6px" }}>3.9 km/l</div>
              </div>
              <div style={{ padding: "11px 13px", borderRadius: "11px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.06)" }}>
                <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "8.5px", fontWeight: "500", letterSpacing: ".18em", textTransform: "uppercase", color: "#93939A" }}>Last ping</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "#050816", marginTop: "6px" }}>3 s ago</div>
              </div>
            </div>
            <div style={{ padding: "16px 20px", flex: "1", minHeight: "0" }}>
              <div style={{ fontFamily: "var(--font-eyebrow)", fontSize: "9px", fontWeight: "500", letterSpacing: ".2em", textTransform: "uppercase", color: "#93939A", marginBottom: "12px" }}>Recent events</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A", whiteSpace: "nowrap" }}>11:42</span>
                  <span style={{ fontSize: "12px", lineHeight: "18px", color: "#050816" }}>Crossed Igatpuri toll</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A", whiteSpace: "nowrap" }}>09:18</span>
                  <span style={{ fontSize: "12px", lineHeight: "18px", color: "#050816" }}>Halt 22 min · driver break</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "#93939A", whiteSpace: "nowrap" }}>04:20</span>
                  <span style={{ fontSize: "12px", lineHeight: "18px", color: "#050816" }}>Exited Bhiwandi ICD geofence</span>
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid rgba(5,8,22,.07)", display: "flex", gap: "10px" }}>
              <span style={{ flex: "1", textAlign: "center", padding: "11px 14px", borderRadius: "10px", background: "var(--nova-rage-400)", border: "1px solid var(--nova-rage-800)", fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>Open trip</span>
              <span style={{ flex: "1", textAlign: "center", padding: "11px 14px", borderRadius: "10px", background: "#FFFFFF", border: "1px solid rgba(5,8,22,.10)", fontSize: "13px", fontWeight: "600", color: "#050816" }}>Replay route</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
