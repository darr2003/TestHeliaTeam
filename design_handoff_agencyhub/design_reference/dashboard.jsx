// Dashboard screen
const D_DASH = window.AH_DATA;

function Dashboard() {
  const totals = D_DASH.ACCOUNTS.reduce((acc, a) => {
    if (a.currency === "CLP") {
      const t = D_DASH.accountTotals(a);
      acc.planned += t.planned;
      acc.spent += t.spent;
    }
    return acc;
  }, { planned: 0, spent: 0 });
  const ratio = totals.spent / totals.planned;
  const expectedToday = totals.planned * (D_DASH.TODAY_DAY / D_DASH.DAYS_IN_MONTH);
  const paceRatio = totals.spent / expectedToday;
  const totalAlerts = D_DASH.ACCOUNTS.reduce((s, a) => s + a.alerts, 0);

  // sort: critical first, then warn, then ok, then by name
  const sortKey = (a) => {
    const s = D_DASH.accountStatus(a);
    return s === "crit" ? 0 : s === "warn" ? 1 : s === "low" ? 2 : 3;
  };
  const accounts = [...D_DASH.ACCOUNTS].sort((a,b) => sortKey(a) - sortKey(b));

  const [filter, setFilter] = useState("todas");
  const visible = filter === "alertas"
    ? accounts.filter(a => a.alerts > 0)
    : filter === "critico"
    ? accounts.filter(a => D_DASH.accountStatus(a) === "crit")
    : accounts;

  return (
    <div className="ah-app">
      <Sidebar activeId="dashboard"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "DASHBOARD"]}
          monthLabel="ABR · 2026"
          alerts={totalAlerts}
          syncLabel="Sincronizar todas"
        />
        <div className="ah-content">

          {/* Page head — editorial headline */}
          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>01 / DASHBOARD</div>
              <h1 className="ah-page-title">
                Plan vs <span className="cm-thin">real</span>, todas las cuentas<span className="cm-dot"/>
              </h1>
              <p className="ah-page-sub">
                Día {D_DASH.TODAY_DAY} de {D_DASH.DAYS_IN_MONTH} · Última sincronización automática hace 2 horas.
              </p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="ah-kpi-strip">
            <div className="ah-kpi">
              <span className="ah-kpi-label">Presupuesto · CLP</span>
              <span className="ah-kpi-value tabnum">${(totals.planned/1e6).toFixed(1)}<span className="ah-kpi-unit">M</span></span>
              <span className="ah-kpi-foot"><span>6 cuentas activas</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Gastado al día {D_DASH.TODAY_DAY}</span>
              <span className="ah-kpi-value tabnum">${(totals.spent/1e6).toFixed(1)}<span className="ah-kpi-unit">M</span></span>
              <span className="ah-kpi-foot"><span className="ah-kpi-delta">{D_DASH.fmtPct(ratio)} ejecución global</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Ritmo agencia</span>
              <span className="ah-kpi-value tabnum">{paceRatio.toFixed(2)}<span className="ah-kpi-unit">×</span></span>
              <span className="ah-kpi-foot">
                <StatusBadge kind={paceRatio > 1.15 ? "warn" : "ok"}>
                  {paceRatio > 1.15 ? "Acelerado" : "Normal"}
                </StatusBadge>
              </span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Alarmas activas</span>
              <span className="ah-kpi-value tabnum" style={{color: totalAlerts > 5 ? "var(--ah-crit)" : "var(--cm-ink)"}}>{totalAlerts}</span>
              <span className="ah-kpi-foot">
                <span style={{color:"var(--ah-crit)"}}>2 críticas</span>
                <span>·</span>
                <span style={{color:"var(--ah-warn)"}}>5 warning</span>
              </span>
            </div>
          </div>

          {/* Section: cuentas */}
          <div className="ah-section">
            <div className="ah-section-head">
              <div style={{display:"flex",alignItems:"baseline",gap:18}}>
                <h2 className="ah-section-title">Cuentas</h2>
                <span className="ah-section-meta">
                  <span>{accounts.length} cuentas · ordenadas por estado</span>
                </span>
              </div>
              <div className="ah-filterbar">
                <button className={`ah-chip ${filter==="todas"?"is-active":""}`} onClick={() => setFilter("todas")}>Todas <span className="ah-chip-count">{accounts.length}</span></button>
                <button className={`ah-chip ${filter==="alertas"?"is-active":""}`} onClick={() => setFilter("alertas")}>Con alarmas <span className="ah-chip-count">{accounts.filter(a=>a.alerts>0).length}</span></button>
                <button className={`ah-chip ${filter==="critico"?"is-active":""}`} onClick={() => setFilter("critico")}>Críticas <span className="ah-chip-count">{accounts.filter(a=>D_DASH.accountStatus(a)==="crit").length}</span></button>
              </div>
            </div>

            <div className="ah-account-list">
              {visible.map(acc => {
                const t = D_DASH.accountTotals(acc);
                const status = D_DASH.accountStatus(acc);
                const expected = D_DASH.TODAY_DAY / D_DASH.DAYS_IN_MONTH;
                return (
                  <button key={acc.id} className={`ah-account-row is-${status}`}>
                    <div className="ah-account-id">
                      <div className="ah-account-swatch" style={{background: acc.color}}/>
                      <div>
                        <span className="ah-account-name">{acc.name}</span>
                        <span className="ah-account-meta">{acc.currency} · {acc.fullName}</span>
                      </div>
                    </div>

                    <div className="ah-account-channels">
                      {acc.channels.map(ch => {
                        const r = ch.spent / ch.planned;
                        return (
                          <div key={ch.platform} className="ah-channel-line">
                            <span className="ah-channel-name">
                              <span className={`ah-mini-status is-${ch.status}`} style={{display:"inline-block",marginRight:6}}/>
                              {D_DASH.PLATFORM_LABELS[ch.platform].name}
                            </span>
                            <div className="ah-channel-bar-wrap">
                              <ProgressBar ratio={r} status={ch.status} paceMarker={expected}/>
                            </div>
                            <span className="ah-channel-amount">{D_DASH.fmtMoney(ch.spent, acc.currency)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="ah-account-summary">
                      <span className={`ah-account-pct tabnum ${status==="crit"?"is-crit":status==="warn"?"is-warn":""}`}>
                        {(t.ratio*100).toFixed(1)}<span className="ah-pct-unit">%</span>
                      </span>
                      <span className="ah-account-totals">
                        {D_DASH.fmtMoney(t.spent, acc.currency)} / {D_DASH.fmtMoney(t.planned, acc.currency)}
                      </span>
                    </div>

                    <div className="ah-account-status">
                      {status === "crit" && <StatusBadge kind="crit">Crítico</StatusBadge>}
                      {status === "warn" && <StatusBadge kind="warn">Atención</StatusBadge>}
                      {status === "low"  && <StatusBadge kind="low">Subgasto</StatusBadge>}
                      {status === "ok"   && <StatusBadge kind="ok">Normal</StatusBadge>}
                      {acc.alerts > 0 && (
                        <span className="ah-account-totals" style={{marginTop:2}}>
                          {acc.alerts} alarma{acc.alerts>1?"s":""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.Dashboard = Dashboard;
