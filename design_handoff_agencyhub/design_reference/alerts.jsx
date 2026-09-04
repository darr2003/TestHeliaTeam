// Alerts screen
const D_ALR = window.AH_DATA;

const ALERTS = [
  { id:1, severity:"crit", type:"overspend",     account:"LINK USS",  platform:"google_ads", message:"Google Ads superó el 100% del presupuesto mensual ($1,147,000 de $1,100,000).", threshold:"100%", current:"104.3%", time:"hace 18 min", read:false },
  { id:2, severity:"crit", type:"abnormal_pace", account:"KIBO",      platform:"google_ads", message:"Conexión OAuth con error desde hace 8 horas. Sincronización automática detenida.", threshold:"3 fallos", current:"5 fallos", time:"hace 1 h", read:false },
  { id:3, severity:"warn", type:"overspend",     account:"CHC",       platform:"meta_ads",   message:"Meta Ads alcanzó el 95% del presupuesto mensual ($1,425,000 de $1,500,000).", threshold:"90%", current:"95.0%", time:"hace 2 h", read:false },
  { id:4, severity:"warn", type:"low_budget",    account:"LINK USS",  platform:"google_ads", message:"Al ritmo actual el presupuesto se agota en ~2 días (quedan -$47K, gasto diario $52K).", threshold:"2 días", current:"-0.9 días", time:"hace 2 h", read:false },
  { id:5, severity:"warn", type:"abnormal_pace", account:"VITEPAL",   platform:"meta_ads",   message:"Gasto del día ($120K) es 2.3× el promedio diario de los últimos 7 días ($52K).", threshold:"1.5×", current:"2.3×", time:"hace 4 h", read:true },
  { id:6, severity:"warn", type:"overspend",     account:"VITEPAL",   platform:"meta_ads",   message:"Meta Ads alcanzó el 87% del presupuesto. Se proyecta sobregasto al cierre del mes.", threshold:"90%", current:"87.1%", time:"hace 6 h", read:true },
  { id:7, severity:"warn", type:"low_budget",    account:"KIBO",      platform:"meta_ads",   message:"Quedan US$280 disponibles. Al ritmo actual ~3 días de cobertura.", threshold:"5 días", current:"3.1 días", time:"hace 8 h", read:true },
];

const TYPE_LABEL = {
  overspend: "Sobregasto",
  low_budget: "Presupuesto bajo",
  abnormal_pace: "Ritmo anormal",
};

function Alerts() {
  const [filter, setFilter] = useState("activas");
  const visible = ALERTS.filter(a => {
    if (filter === "activas") return !a.read;
    if (filter === "criticas") return a.severity === "crit";
    return true;
  });

  const counts = {
    activas: ALERTS.filter(a => !a.read).length,
    criticas: ALERTS.filter(a => a.severity === "crit").length,
    todas: ALERTS.length,
  };

  return (
    <div className="ah-app">
      <Sidebar activeId="alerts"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "ALARMAS"]}
          monthLabel="ABR · 2026"
          alerts={counts.activas}
          syncLabel="Marcar todas leídas"
        />
        <div className="ah-content">

          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>05 / ALARMAS</div>
              <h1 className="ah-page-title">
                Señales que <span className="cm-thin">importan</span><span className="cm-dot"/>
              </h1>
              <p className="ah-page-sub">
                Sobregasto · presupuesto bajo · ritmo anormal. Evaluadas después de cada sincronización.
              </p>
            </div>
          </div>

          <div className="ah-kpi-strip">
            <div className="ah-kpi">
              <span className="ah-kpi-label">Activas</span>
              <span className="ah-kpi-value tabnum">{counts.activas}</span>
              <span className="ah-kpi-foot"><span>Sin leer</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Críticas</span>
              <span className="ah-kpi-value tabnum" style={{color: counts.criticas ? "var(--ah-crit)" : "var(--cm-ink)"}}>{counts.criticas}</span>
              <span className="ah-kpi-foot"><span>Requieren acción inmediata</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Sobregasto</span>
              <span className="ah-kpi-value tabnum">{ALERTS.filter(a=>a.type==="overspend").length}</span>
              <span className="ah-kpi-foot"><span>Plan superado o cerca</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Ritmo anormal</span>
              <span className="ah-kpi-value tabnum">{ALERTS.filter(a=>a.type==="abnormal_pace").length}</span>
              <span className="ah-kpi-foot"><span>Verificar campañas</span></span>
            </div>
          </div>

          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Bandeja</h2>
              <div className="ah-filterbar">
                <button className={`ah-chip ${filter==="activas"?"is-active":""}`} onClick={() => setFilter("activas")}>Activas <span className="ah-chip-count">{counts.activas}</span></button>
                <button className={`ah-chip ${filter==="criticas"?"is-active":""}`} onClick={() => setFilter("criticas")}>Críticas <span className="ah-chip-count">{counts.criticas}</span></button>
                <button className={`ah-chip ${filter==="todas"?"is-active":""}`} onClick={() => setFilter("todas")}>Todas <span className="ah-chip-count">{counts.todas}</span></button>
              </div>
            </div>

            <div style={{borderTop:"1px solid var(--cm-rule)"}}>
              {visible.map(a => {
                const acc = D_ALR.ACCOUNTS.find(x => x.name === a.account);
                return (
                  <div key={a.id} style={{
                    display:"grid",
                    gridTemplateColumns:"40px 200px 1fr 140px 140px 90px",
                    alignItems:"center",
                    gap:18,
                    padding:"18px 12px",
                    borderBottom:"1px solid var(--cm-rule)",
                    background: a.read ? "transparent" : (a.severity==="crit" ? "var(--ah-crit-soft)" : "var(--ah-warn-soft)"),
                    backgroundImage: a.read ? "none" : (a.severity==="crit" ? "linear-gradient(90deg, transparent 0, transparent 100%)" : "none"),
                    opacity: a.read ? 0.55 : 1,
                  }}>
                    <div style={{display:"flex",justifyContent:"center"}}>
                      <span style={{
                        width:10,height:10,borderRadius:"50%",
                        background: a.severity==="crit"?"var(--ah-crit)":"var(--ah-warn)",
                        boxShadow: a.read ? "none" : `0 0 0 4px ${a.severity==="crit"?"rgba(184,58,42,0.15)":"rgba(183,121,31,0.15)"}`,
                      }}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {acc && <div style={{width:5,height:22,background:acc.color,borderRadius:1}}/>}
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{a.account}</div>
                        <div style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.12em",color:"var(--cm-ink-40)",textTransform:"uppercase",marginTop:2}}>
                          {D_ALR.PLATFORM_LABELS[a.platform].name} · {TYPE_LABEL[a.type]}
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:14,color:"var(--cm-ink)",lineHeight:1.45,paddingRight:14}}>{a.message}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:2}}>
                      <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.12em",color:"var(--cm-ink-40)",textTransform:"uppercase"}}>Umbral / actual</span>
                      <span style={{fontFamily:"var(--cm-mono)",fontSize:12,color:"var(--cm-ink)"}}>{a.threshold} → <strong>{a.current}</strong></span>
                    </div>
                    <div style={{fontFamily:"var(--cm-mono)",fontSize:11,color:"var(--cm-ink-60)"}}>{a.time}</div>
                    <div style={{display:"flex",justifyContent:"flex-end",gap:6}}>
                      {!a.read && (
                        <button className="ah-btn-ghost" style={{padding:"5px 10px",fontSize:11}} title="Marcar como leída">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l5 5L21 5"/></svg>
                        </button>
                      )}
                      <button className="ah-btn-ghost" style={{padding:"5px 10px",fontSize:11}} title="Descartar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.Alerts = Alerts;
