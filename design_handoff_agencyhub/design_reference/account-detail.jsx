// Account detail screen — CHC, Abril 2026
const D_DET = window.AH_DATA;

// Cumulative spend chart (SVG)
function SpendChart({ daily, plannedTotal, daysInMonth, currency }) {
  const W = 880, H = 280;
  const padL = 56, padR = 24, padT = 16, padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxY = plannedTotal * 1.05;
  const x = (d) => padL + (d / daysInMonth) * innerW;
  const y = (v) => padT + innerH - (v / maxY) * innerH;

  // Plan line: 0 → plannedTotal across daysInMonth
  const planX1 = x(0), planY1 = y(0);
  const planX2 = x(daysInMonth), planY2 = y(plannedTotal);

  // Cumulative paths
  const buildPath = (key) => {
    let p = `M ${x(0)} ${y(0)}`;
    daily.forEach(d => { p += ` L ${x(d.day)} ${y(d[key])}`; });
    return p;
  };
  const totalPath = buildPath("totalCum");
  const metaPath = buildPath("metaCum");
  const googlePath = buildPath("googleCum");

  // area between plan and total (deviation)
  const lastDay = daily[daily.length - 1];
  const todayPlan = plannedTotal * (lastDay.day / daysInMonth);
  const dev = lastDay.totalCum - todayPlan;

  // y axis ticks (4)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    val: maxY * t,
    yPos: y(maxY * t),
  }));

  // x axis ticks (every 5 days)
  const xticks = [1, 5, 10, 15, 20, 25, 30].filter(d => d <= daysInMonth);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:"block"}}>
      {/* grid lines */}
      {ticks.map((t, i) => (
        <line key={i} x1={padL} x2={W-padR} y1={t.yPos} y2={t.yPos} stroke="#E7E6E2" strokeWidth="1"/>
      ))}
      {/* y labels */}
      {ticks.map((t, i) => (
        <text key={i} x={padL - 8} y={t.yPos + 3} fontSize="10" fontFamily="JetBrains Mono" fill="#8B8B95" textAnchor="end" letterSpacing="0.04em">
          ${(t.val/1e6).toFixed(1)}M
        </text>
      ))}
      {/* x labels */}
      {xticks.map(d => (
        <text key={d} x={x(d)} y={H - 12} fontSize="10" fontFamily="JetBrains Mono" fill="#8B8B95" textAnchor="middle" letterSpacing="0.06em">{d}</text>
      ))}
      {/* today vertical */}
      <line x1={x(lastDay.day)} x2={x(lastDay.day)} y1={padT} y2={H-padB} stroke="#7866FA" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
      <text x={x(lastDay.day) + 6} y={padT + 12} fontSize="9" fontFamily="JetBrains Mono" fill="#7866FA" letterSpacing="0.14em">HOY</text>

      {/* plan line (dashed) */}
      <line x1={planX1} y1={planY1} x2={planX2} y2={planY2} stroke="#8B8B95" strokeWidth="1" strokeDasharray="4 4"/>

      {/* per-channel cumulative */}
      <path d={metaPath}   fill="none" stroke="#1877F2" strokeWidth="1.5" opacity="0.7"/>
      <path d={googlePath} fill="none" stroke="#4285F4" strokeWidth="1.5" opacity="0.7"/>

      {/* total cumulative — main line */}
      <path d={totalPath} fill="none" stroke="#0B0B0F" strokeWidth="2"/>

      {/* dot at today */}
      <circle cx={x(lastDay.day)} cy={y(lastDay.totalCum)} r="4" fill="#0B0B0F"/>
      <circle cx={x(lastDay.day)} cy={y(lastDay.totalCum)} r="8" fill="#0B0B0F" opacity="0.12"/>

      {/* deviation label */}
      <text x={x(lastDay.day) - 8} y={y(lastDay.totalCum) - 12} fontSize="11" fontFamily="JetBrains Mono" fill="#0B0B0F" textAnchor="end" fontWeight="500">
        ${(lastDay.totalCum/1e6).toFixed(2)}M
      </text>
    </svg>
  );
}

function AccountDetail() {
  const acc = D_DET.ACCOUNTS.find(a => a.id === "chc");
  const t = D_DET.accountTotals(acc);
  const expected = t.planned * (D_DET.TODAY_DAY / D_DET.DAYS_IN_MONTH);
  const paceRatio = t.spent / expected;
  const dailyAvg = t.spent / D_DET.TODAY_DAY;
  const remaining = t.planned - t.spent;
  const daysOfBudget = remaining / dailyAvg;

  // Build per-channel rows with computed values
  const rows = acc.channels.map(ch => {
    const ratio = ch.spent / ch.planned;
    const expCh = ch.planned * (D_DET.TODAY_DAY / D_DET.DAYS_IN_MONTH);
    const paceCh = ch.spent / expCh;
    let paceLabel = "Normal", paceKind = "ok";
    if (paceCh > 1.30) { paceLabel = "Crítico"; paceKind = "crit"; }
    else if (paceCh > 1.15) { paceLabel = "Acelerado"; paceKind = "warn"; }
    else if (paceCh < 0.85) { paceLabel = "Bajo"; paceKind = "low"; }
    return { ch, ratio, paceCh, paceLabel, paceKind };
  });

  return (
    <div className="ah-app">
      <Sidebar activeId="dashboard"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "DASHBOARD", "CHC"]}
          monthLabel="ABR · 2026"
          alerts={2}
          syncLabel="Sincronizar ahora"
        />
        <div className="ah-content">

          {/* Account header */}
          <div className="ah-account-header">
            <div className="ah-account-header-left">
              <div className="ah-account-header-swatch" style={{background: acc.color}}/>
              <div>
                <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>CUENTA · 02</div>
                <h1>CHC<span className="cm-dot" style={{background:"#7866FA",display:"inline-block",width:"0.16em",height:"0.16em",borderRadius:"50%",marginLeft:"0.06em",transform:"translateY(-0.1em)"}}/></h1>
                <div className="ah-account-header-meta">
                  <span>{acc.fullName}</span>
                  <span className="ah-meta-dot"/>
                  <span>{acc.currency}</span>
                  <span className="ah-meta-dot"/>
                  <span>2 conexiones activas</span>
                  <span className="ah-meta-dot"/>
                  <span>Última sync: hace 2 h</span>
                </div>
              </div>
            </div>
            <div className="ah-account-header-right">
              <StatusBadge kind="warn">Meta · 95% del plan</StatusBadge>
              <StatusBadge kind="ok">Google · ritmo normal</StatusBadge>
            </div>
          </div>

          {/* KPI strip — detalle */}
          <div className="ah-kpi-strip ah-kpi-strip-detail">
            <div className="ah-kpi">
              <span className="ah-kpi-label">Planificado</span>
              <span className="ah-kpi-value tabnum">$3.5<span className="ah-kpi-unit">M</span></span>
              <span className="ah-kpi-foot"><span>2 canales</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Gastado</span>
              <span className="ah-kpi-value tabnum">$3.2<span className="ah-kpi-unit">M</span></span>
              <span className="ah-kpi-foot"><span>{D_DET.fmtPct(t.ratio)} ejecución</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Disponible</span>
              <span className="ah-kpi-value tabnum">${(remaining/1e3).toFixed(0)}<span className="ah-kpi-unit">K</span></span>
              <span className="ah-kpi-foot"><span>quedan 8 días</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Días</span>
              <span className="ah-kpi-value tabnum">{D_DET.TODAY_DAY}<span className="ah-kpi-unit" style={{color:"var(--cm-ink-40)"}}>/ {D_DET.DAYS_IN_MONTH}</span></span>
              <span className="ah-kpi-foot"><span>73% del mes</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Gasto diario prom.</span>
              <span className="ah-kpi-value tabnum">${(dailyAvg/1e3).toFixed(0)}<span className="ah-kpi-unit">K</span></span>
              <span className="ah-kpi-foot"><span>esperado: $117K</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Ritmo</span>
              <span className="ah-kpi-value tabnum">{paceRatio.toFixed(2)}<span className="ah-kpi-unit">×</span></span>
              <span className="ah-kpi-foot">
                <StatusBadge kind={paceRatio > 1.15 ? "warn" : "ok"}>
                  {paceRatio > 1.15 ? "Acelerado" : "Normal"}
                </StatusBadge>
              </span>
            </div>
          </div>

          {/* Plan vs Real table */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Plan vs real · por canal</h2>
              <span className="ah-section-meta">Abril 2026 · día {D_DET.TODAY_DAY} de {D_DET.DAYS_IN_MONTH}</span>
            </div>
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th className="num">Planificado</th>
                    <th className="num">Gastado</th>
                    <th className="num">Disponible</th>
                    <th className="num">% Ejec.</th>
                    <th>Ritmo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const status = r.ch.status;
                    const statusLabel = status === "crit" ? "Crítico" : status === "warn" ? "Atención" : status === "low" ? "Subgasto" : "Normal";
                    return (
                      <tr key={r.ch.platform}>
                        <td>
                          <span className="ah-table-channel">
                            <ChannelMark platform={r.ch.platform}/>
                            {D_DET.PLATFORM_LABELS[r.ch.platform].name}
                          </span>
                        </td>
                        <td className="num">{D_DET.fmtMoney(r.ch.planned, acc.currency)}</td>
                        <td className="num">{D_DET.fmtMoney(r.ch.spent, acc.currency)}</td>
                        <td className="num muted">{D_DET.fmtMoney(r.ch.planned - r.ch.spent, acc.currency)}</td>
                        <td className="num"><strong>{(r.ratio*100).toFixed(1)}%</strong></td>
                        <td><StatusBadge kind={r.paceKind}>{r.paceLabel}</StatusBadge></td>
                        <td><StatusBadge kind={status}>{statusLabel}</StatusBadge></td>
                      </tr>
                    );
                  })}
                  <tr className="is-total">
                    <td>Total cuenta</td>
                    <td className="num">{D_DET.fmtMoney(t.planned, acc.currency)}</td>
                    <td className="num">{D_DET.fmtMoney(t.spent, acc.currency)}</td>
                    <td className="num">{D_DET.fmtMoney(t.planned - t.spent, acc.currency)}</td>
                    <td className="num">{(t.ratio*100).toFixed(1)}%</td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="ah-chart-card">
            <div className="ah-chart-head">
              <div>
                <h2 className="ah-section-title" style={{fontSize:16}}>Gasto acumulado · día a día</h2>
                <span className="ah-section-meta" style={{marginTop:4,display:"block"}}>Real vs plan lineal</span>
              </div>
              <div className="ah-chart-legend">
                <span className="ah-chart-legend-item"><span className="ah-legend-swatch"/>Total real</span>
                <span className="ah-chart-legend-item"><span className="ah-legend-swatch meta"/>Meta Ads</span>
                <span className="ah-chart-legend-item"><span className="ah-legend-swatch google"/>Google Ads</span>
                <span className="ah-chart-legend-item"><span className="ah-legend-swatch dashed"/>Plan lineal</span>
              </div>
            </div>
            <SpendChart
              daily={D_DET.CHC_DAILY}
              plannedTotal={t.planned}
              daysInMonth={D_DET.DAYS_IN_MONTH}
              currency={acc.currency}
            />
          </div>

          {/* Daily table — expandable, mostramos últimos 7 */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Gasto diario · últimos 7 días</h2>
              <button className="ah-btn-ghost" style={{padding:"6px 14px",fontSize:12}}>
                Ver mes completo
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </button>
            </div>
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="num">Meta Ads</th>
                    <th className="num">Google Ads</th>
                    <th className="num">Total día</th>
                    <th className="num">Acumulado</th>
                    <th className="num">% del plan</th>
                  </tr>
                </thead>
                <tbody>
                  {D_DET.CHC_DAILY.slice(-7).map(d => (
                    <tr key={d.day}>
                      <td className="muted">{d.day} abr</td>
                      <td className="num">{D_DET.fmtCLP(d.meta)}</td>
                      <td className="num">{D_DET.fmtCLP(d.google)}</td>
                      <td className="num"><strong>{D_DET.fmtCLP(d.total)}</strong></td>
                      <td className="num muted">{D_DET.fmtCLP(d.totalCum)}</td>
                      <td className="num muted">{((d.totalCum / t.planned) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.AccountDetail = AccountDetail;
