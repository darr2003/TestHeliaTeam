// Budgets screen — list por cuenta, edición inline, copiar mes anterior
const D_BUD = window.AH_DATA;

function Budgets() {
  const [editingId, setEditingId] = useState(null);

  // Construir filas: una por (cuenta × plataforma) basada en data
  const rows = [];
  D_BUD.ACCOUNTS.forEach(acc => {
    acc.channels.forEach(ch => {
      const prevMonth = Math.round(ch.planned * (0.92 + Math.random() * 0.16));
      rows.push({
        id: `${acc.id}-${ch.platform}`,
        account: acc,
        platform: ch.platform,
        planned: ch.planned,
        prevMonth,
        currency: acc.currency,
      });
    });
  });

  return (
    <div className="ah-app">
      <Sidebar activeId="budgets"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "PRESUPUESTOS"]}
          monthLabel="ABR · 2026"
          alerts={7}
          syncLabel="Guardar cambios"
        />
        <div className="ah-content">

          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>04 / PRESUPUESTOS</div>
              <h1 className="ah-page-title">
                Plan mensual <span className="cm-thin">por cuenta</span><span className="cm-dot"/>
              </h1>
              <p className="ah-page-sub">
                Una línea por cuenta y canal. Edición inline. Restricción única: cuenta + plataforma + mes.
              </p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="ah-btn-ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
                Copiar de marzo
              </button>
              <button className="ah-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Nueva línea
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="ah-kpi-strip">
            <div className="ah-kpi">
              <span className="ah-kpi-label">Total planificado · CLP</span>
              <span className="ah-kpi-value tabnum">$9.0<span className="ah-kpi-unit">M</span></span>
              <span className="ah-kpi-foot"><span>5 cuentas CLP</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Total · USD</span>
              <span className="ah-kpi-value tabnum">$8.0<span className="ah-kpi-unit">K</span></span>
              <span className="ah-kpi-foot"><span>1 cuenta USD</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">vs. marzo</span>
              <span className="ah-kpi-value tabnum" style={{color:"var(--ah-ok)"}}>+8.4<span className="ah-kpi-unit">%</span></span>
              <span className="ah-kpi-foot"><span className="ah-kpi-delta is-up">↗ Ajuste estacional</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Líneas configuradas</span>
              <span className="ah-kpi-value tabnum">{rows.length}<span className="ah-kpi-unit">/ 12</span></span>
              <span className="ah-kpi-foot"><span>Todas las cuentas cubiertas</span></span>
            </div>
          </div>

          {/* Tabla */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Líneas de presupuesto</h2>
              <span className="ah-section-meta">Abril 2026 · click sobre una línea para editar</span>
            </div>

            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Cuenta</th>
                    <th>Canal</th>
                    <th className="num">Mes anterior</th>
                    <th className="num">Δ</th>
                    <th className="num">Planificado abr</th>
                    <th>Notas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const delta = r.planned - r.prevMonth;
                    const deltaPct = (delta / r.prevMonth) * 100;
                    const isEditing = editingId === r.id;
                    return (
                      <tr key={r.id} style={isEditing ? {background:"var(--cm-bone)"}: {}}>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:6,height:18,background:r.account.color,borderRadius:1}}/>
                            <strong>{r.account.name}</strong>
                            <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.12em",color:"var(--cm-ink-40)"}}>{r.currency}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ah-table-channel" style={{fontWeight:500,fontSize:13}}>
                            <ChannelMark platform={r.platform}/>
                            {D_BUD.PLATFORM_LABELS[r.platform].name}
                          </span>
                        </td>
                        <td className="num muted">{D_BUD.fmtMoney(r.prevMonth, r.currency)}</td>
                        <td className="num">
                          <span className={`ah-delta ${delta >= 0 ? "is-pos" : "is-neg"}`}>
                            {delta >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="num">
                          {isEditing ? (
                            <div className="ah-field-input" style={{maxWidth:160,marginLeft:"auto"}}>
                              <input defaultValue={r.planned.toLocaleString("es-CL")} style={{textAlign:"right",fontFamily:"var(--cm-mono)",fontSize:13,fontWeight:600}}/>
                            </div>
                          ) : (
                            <strong style={{fontFamily:"var(--cm-mono)",fontSize:14}}>{D_BUD.fmtMoney(r.planned, r.currency)}</strong>
                          )}
                        </td>
                        <td className="muted" style={{fontSize:12,fontStyle:"italic"}}>
                          {r.platform === "google_ads" && r.account.id === "vitepal" ? "Sin pauta search · sólo display" : "—"}
                        </td>
                        <td style={{textAlign:"right"}}>
                          {isEditing ? (
                            <div style={{display:"inline-flex",gap:6}}>
                              <button className="ah-btn-ghost" style={{padding:"6px 12px",fontSize:11}} onClick={() => setEditingId(null)}>Cancelar</button>
                              <button className="ah-btn" style={{padding:"6px 14px",fontSize:11}} onClick={() => setEditingId(null)}>Guardar</button>
                            </div>
                          ) : (
                            <button className="ah-btn-ghost" style={{padding:"6px 12px",fontSize:11}} onClick={() => setEditingId(r.id)}>
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Copiar de mes anterior — preview */}
          <div className="ah-conn-form">
            <div className="ah-conn-form-head">
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>ATAJO</div>
              <h3 style={{marginTop:14}}>Copiar plan de marzo.</h3>
              <p>Trae las mismas líneas con los montos del mes anterior. Podés ajustar antes de guardar.</p>
            </div>
            <div className="ah-conn-form-fields">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div className="ah-field">
                  <label className="ah-field-label">Desde</label>
                  <div className="ah-field-input">
                    <input defaultValue="Marzo 2026" readOnly/>
                  </div>
                </div>
                <div className="ah-field">
                  <label className="ah-field-label">Hacia</label>
                  <div className="ah-field-input">
                    <input defaultValue="Abril 2026" readOnly/>
                  </div>
                </div>
              </div>
              <div className="ah-form-foot">
                <span className="ah-test-result">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="10"/></svg>
                  Sobrescribirá las 12 líneas existentes de abril.
                </span>
                <button className="ah-btn">Copiar y abrir editor</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.Budgets = Budgets;
