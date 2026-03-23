import { useState, useEffect, useCallback } from "react";
import { STATES, FY26_AWARDS, PHASE_COLORS, RFP_COLORS, fmt } from "../lib/states";

// ── Main component ────────────────────────────────────────────────────────
export default function RHTPTracker() {
  const [stateData,   setStateData]   = useState({});
  const [federalData, setFederalData] = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [lastFetched, setLastFetched] = useState(null);

  // Load saved data on mount
  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch("/api/data");
      const json = await res.json();
      setStateData(json.stateData   || {});
      setFederalData(json.federalData || null);
      setLastFetched(new Date());
    } catch (e) {
      console.error("Fetch error", e);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived values ────────────────────────────────────────────────────
  const doneCount      = STATES.filter(s => stateData[s.code]?.result).length;
  const activeRfpCount = STATES.filter(s => stateData[s.code]?.result?.rfpStatus === "Active RFPs/RFAs open").length;

  const filteredStates = STATES.filter(s => {
    const d = stateData[s.code];
    if (filter === "done" && !d?.result)  return false;
    if (filter === "idle" && d?.result)   return false;
    if (filter === "rfp"  && d?.result?.rfpStatus !== "Active RFPs/RFAs open") return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selState = selected ? STATES.find(s => s.code === selected) : null;
  const selData  = selected ? stateData[selected] : null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Mono','Courier New',monospace", background:"#080b14", minHeight:"100vh", color:"#c8d0e8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#0d1120}
        ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:3px}
        .sc{background:#0d1120;border:1px solid #1e2540;border-radius:6px;padding:14px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
        .sc:hover{border-color:#3d4f7c;background:#111827;transform:translateY(-1px)}
        .sc.sel{border-color:#5baaff;background:#0f1e35}
        .sc.has-data{border-left:3px solid #3ddc84}
        .sc.err{border-left:3px solid #ff6b6b}
        .btn{background:#1a2540;border:1px solid #2a3860;color:#8aa4d8;padding:8px 16px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;transition:all .15s}
        .btn:hover{background:#243060;border-color:#4060a0;color:#c8d0e8}
        .pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500;letter-spacing:.06em}
        .fb{background:transparent;border:1px solid #1e2540;color:#5a6580;padding:5px 12px;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:.08em;text-transform:uppercase;transition:all .15s}
        .fb.act{background:#1a2540;border-color:#3d5080;color:#a8c0e8}
        .fb:hover{border-color:#3d5080;color:#a8c0e8}
        .fade{animation:fadeIn .4s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .slide{animation:slideIn .25s ease}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        input.srch{background:#0d1120;border:1px solid #1e2540;color:#c8d0e8;padding:7px 12px;border-radius:4px;font-family:inherit;font-size:11px;width:200px;outline:none;transition:border-color .15s}
        input.srch:focus{border-color:#3d5080}
        input.srch::placeholder{color:#3a4560}
        .sb{background:#0d1120;border:1px solid #1e2540;border-radius:6px;padding:14px;text-align:center}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"#0a0d1a", borderBottom:"1px solid #1e2540", padding:"20px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#e8f0ff", letterSpacing:"-0.01em" }}>
              RHTP<span style={{ color:"#5baaff" }}>·</span>TRACKER
            </div>
            <div style={{ fontSize:10, color:"#3a4560", letterSpacing:".15em", marginTop:2, textTransform:"uppercase" }}>
              Rural Health Transformation Program — State Monitor
            </div>
          </div>
          {lastFetched && (
            <span style={{ fontSize:10, color:"#2a3050" }}>
              Loaded {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:20, marginTop:16, flexWrap:"wrap" }}>
          {[
            { label:"States w/ Data",  value:doneCount,      total:50,   color:"#3ddc84" },
            { label:"Active RFPs",     value:activeRfpCount, total:null, color:"#f59e0b" },
            { label:"Total FY26",      value:"$10B",         total:null, color:"#5baaff" },
          ].map(stat => (
            <div key={stat.label} style={{ display:"flex", gap:8, alignItems:"baseline" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:stat.color }}>
                {stat.value}{stat.total ? <span style={{ fontSize:13, color:"#3a4560" }}>/{stat.total}</span> : ""}
              </span>
              <span style={{ fontSize:10, color:"#3a4560", letterSpacing:".1em", textTransform:"uppercase" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", height:"calc(100vh - 130px)" }}>

        {/* Left: grid */}
        <div style={{ flex:1, overflow:"auto", padding:"20px 24px" }}>

          {/* Federal banner */}
          {federalData?.result && (
            <div className="fade" style={{ background:"#0f1e35", border:"1px solid #1e4080", borderRadius:6, padding:"14px 18px", marginBottom:20, borderLeft:"3px solid #5baaff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:10, color:"#5baaff", letterSpacing:".12em", textTransform:"uppercase" }}>■ Federal CMS/HHS</span>
                <span style={{ fontSize:10, color:"#3a4560" }}>
                  {federalData.checkedAt ? new Date(federalData.checkedAt).toLocaleString() : ""}
                </span>
              </div>
              <div style={{ fontSize:12, color:"#c8d0e8", lineHeight:1.6 }}>{federalData.result.latestAnnouncement}</div>
              {federalData.result.keyGuidance && (
                <div style={{ fontSize:11, color:"#8aa4d8", marginTop:6 }}>Guidance: {federalData.result.keyGuidance}</div>
              )}
              {federalData.result.cmsUrl && (
                <a href={federalData.result.cmsUrl} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize:10, color:"#3a6090", marginTop:6, display:"block" }}>
                  {federalData.result.cmsUrl}
                </a>
              )}
            </div>
          )}

          {/* Filters */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            {[
              { key:"all",  label:`All (${STATES.length})` },
              { key:"done", label:`Has Data (${doneCount})` },
              { key:"idle", label:`No Data (${STATES.length - doneCount})` },
              { key:"rfp",  label:`Active RFPs (${activeRfpCount})` },
            ].map(f => (
              <button key={f.key} className={`fb ${filter===f.key?"act":""}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
            <input className="srch" placeholder="Search states…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* State grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {filteredStates.map(s => {
              const d     = stateData[s.code];
              const phase = d?.result?.implementationPhase;
              const rfp   = d?.result?.rfpStatus;
              return (
                <div
                  key={s.code}
                  className={`sc ${d?.result ? "has-data" : ""} ${d?.error ? "err" : ""} ${selected===s.code?"sel":""}`}
                  onClick={() => setSelected(selected===s.code ? null : s.code)}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color: d?.result ? "#e8f0ff" : "#7a82a0" }}>{s.code}</div>
                      <div style={{ fontSize:10, color:"#4a5470" }}>{s.name}</div>
                    </div>
                    <div style={{ fontSize:11, color: d?.result ? "#5baaff" : "#2a3050", fontWeight:500 }}>
                      {fmt(FY26_AWARDS[s.code])}
                    </div>
                  </div>

                  {d?.result && (
                    <div className="fade">
                      {phase && (
                        <span className="pill" style={{ background:PHASE_COLORS[phase]+"22", color:PHASE_COLORS[phase], border:`1px solid ${PHASE_COLORS[phase]}44`, marginRight:4, marginBottom:4 }}>
                          {phase}
                        </span>
                      )}
                      {rfp === "Active RFPs/RFAs open" && (
                        <span className="pill" style={{ background:"#10b98122", color:"#10b981", border:"1px solid #10b98144" }}>RFP Open</span>
                      )}
                      <div style={{ fontSize:10, color:"#8aa4d8", marginTop:6, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {d.result.keyHighlight}
                      </div>
                      {d.checkedAt && (
                        <div style={{ fontSize:9, color:"#2a3050", marginTop:6 }}>
                          {new Date(d.checkedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {!d?.result && (
                    <div style={{ fontSize:10, color:"#2a3050", marginTop:4 }}>No data</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && selState && (
          <div className="slide" style={{ width:380, background:"#0a0d1a", borderLeft:"1px solid #1e2540", overflow:"auto", padding:"24px 20px", flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#e8f0ff" }}>{selState.name}</div>
                <div style={{ fontSize:10, color:"#3a4560", letterSpacing:".1em", marginTop:2 }}>{selState.agency}</div>
              </div>
              <button className="btn" style={{ fontSize:10 }} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="sb" style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#5baaff" }}>
                {fmt(FY26_AWARDS[selected])}
              </div>
              <div style={{ fontSize:10, color:"#3a4560", marginTop:4, letterSpacing:".1em", textTransform:"uppercase" }}>FY2026 Award</div>
            </div>

            {!selData?.result && (
              <div style={{ textAlign:"center", padding:"20px", fontSize:12, color:"#3a4560" }}>
                No data available for this state.
              </div>
            )}

            {selData?.result && (
              <div className="fade">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {selData.result.implementationPhase && (() => {
                    const c = PHASE_COLORS[selData.result.implementationPhase];
                    return (
                      <div style={{ flex:1, background:c+"15", border:`1px solid ${c}33`, borderRadius:6, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:10, color:"#4a5470", marginBottom:4, textTransform:"uppercase", letterSpacing:".08em" }}>Phase</div>
                        <div style={{ fontSize:12, color:c, fontWeight:500 }}>{selData.result.implementationPhase}</div>
                      </div>
                    );
                  })()}
                  {selData.result.rfpStatus && (() => {
                    const c = RFP_COLORS[selData.result.rfpStatus] || "#6b7280";
                    return (
                      <div style={{ flex:1, background:c+"15", border:`1px solid ${c}33`, borderRadius:6, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:10, color:"#4a5470", marginBottom:4, textTransform:"uppercase", letterSpacing:".08em" }}>RFPs</div>
                        <div style={{ fontSize:11, color:c, fontWeight:500, lineHeight:1.3 }}>{selData.result.rfpStatus}</div>
                      </div>
                    );
                  })()}
                </div>

                {[
                  { label:"Key Highlight",   value:selData.result.keyHighlight,  textColor:"#c8d0e8" },
                  { label:"Latest Activity", value:selData.result.lastActivity,  textColor:"#8aa4d8", date:selData.result.activityDate },
                  { label:"Source",          value:selData.result.source,        textColor:"#3a6090" },
                ].filter(x => x.value).map(x => (
                  <div key={x.label} style={{ background:"#0d1120", border:"1px solid #1e2540", borderRadius:6, padding:"14px", marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ fontSize:10, color:"#3a4560", letterSpacing:".1em", textTransform:"uppercase" }}>{x.label}</div>
                      {x.date && <div style={{ fontSize:10, color:"#3a4560" }}>{x.date}</div>}
                    </div>
                    <div style={{ fontSize:12, color:x.textColor, lineHeight:1.6, wordBreak:"break-word" }}>{x.value}</div>
                  </div>
                ))}

                <div style={{ marginBottom:12 }}>
                  <a href={selState.url} target="_blank" rel="noopener noreferrer"
                     style={{ display:"block", fontSize:10, color:"#3a6090", marginBottom:4 }}>↗ State RHTP Page</a>
                  <a href="https://www.cms.gov/priorities/rural-health-transformation-rht-program/overview" target="_blank" rel="noopener noreferrer"
                     style={{ display:"block", fontSize:10, color:"#3a6090" }}>↗ CMS RHTP Overview</a>
                </div>

                {selData.checkedAt && (
                  <div style={{ fontSize:10, color:"#2a3050", borderTop:"1px solid #1e2540", paddingTop:12 }}>
                    Data from: {new Date(selData.checkedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:"#0a0d1a", borderTop:"1px solid #1e2540", padding:"10px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:10, color:"#2a3050" }}>Sources: CMS.gov · 50 State DOH Websites · HHS.gov</div>
        <div style={{ fontSize:10, color:"#2a3050" }}>AI-powered via Claude + live web search</div>
      </div>
    </div>
  );
}
