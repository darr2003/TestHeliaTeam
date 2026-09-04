// Connections screen
const D_CONN = window.AH_DATA;

function ConnectionStatusBadge({ status }) {
  if (status === "ok")    return <StatusBadge kind="ok">Conectada</StatusBadge>;
  if (status === "error") return <StatusBadge kind="crit">Error</StatusBadge>;
  if (status === "unset") return <StatusBadge kind="ghost">Sin configurar</StatusBadge>;
  return null;
}

function Connections() {
  // group connections by account
  const byAccount = D_CONN.ACCOUNTS.map(acc => ({
    account: acc,
    conns: D_CONN.CONNECTIONS.filter(c => c.accountId === acc.id),
  }));

  const totalConns = D_CONN.CONNECTIONS.length;
  const okConns = D_CONN.CONNECTIONS.filter(c => c.status === "ok").length;
  const errConns = D_CONN.CONNECTIONS.filter(c => c.status === "error").length;
  const unsetConns = D_CONN.CONNECTIONS.filter(c => c.status === "unset").length;

  return (
    <div className="ah-app">
      <Sidebar activeId="connections"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "CONEXIONES"]}
          monthLabel="ABR · 2026"
          alerts={7}
          syncLabel="Probar todas"
        />
        <div className="ah-content">

          {/* Page head */}
          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>03 / CONEXIONES</div>
              <h1 className="ah-page-title">
                APIs de plataformas <span className="cm-thin">por cuenta</span><span className="cm-dot"/>
              </h1>
              <p className="ah-page-sub">
                Tokens almacenados encriptados. Sync automático cada 4 horas. Sólo administradores pueden crear o editar conexiones.
              </p>
            </div>
            <button className="ah-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Nueva conexión
            </button>
          </div>

          {/* KPI strip */}
          <div className="ah-kpi-strip">
            <div className="ah-kpi">
              <span className="ah-kpi-label">Total conexiones</span>
              <span className="ah-kpi-value tabnum">{totalConns}</span>
              <span className="ah-kpi-foot"><span>{D_CONN.ACCOUNTS.length} cuentas · 2 plataformas</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Sincronizando</span>
              <span className="ah-kpi-value tabnum" style={{color:"var(--ah-ok)"}}>{okConns}</span>
              <span className="ah-kpi-foot"><span>Última corrida 14:32</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Con error</span>
              <span className="ah-kpi-value tabnum" style={{color: errConns ? "var(--ah-crit)" : "var(--cm-ink)"}}>{errConns}</span>
              <span className="ah-kpi-foot"><span>Requieren acción</span></span>
            </div>
            <div className="ah-kpi">
              <span className="ah-kpi-label">Sin configurar</span>
              <span className="ah-kpi-value tabnum" style={{color: unsetConns ? "var(--ah-warn)" : "var(--cm-ink)"}}>{unsetConns}</span>
              <span className="ah-kpi-foot"><span>Pendientes de credenciales</span></span>
            </div>
          </div>

          {/* List by account */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Conexiones por cuenta</h2>
              <span className="ah-section-meta">Token expira: {">"} 60 días para todas</span>
            </div>

            <div className="ah-conn-list">
              {byAccount.map(({ account, conns }) => (
                conns.map((c, i) => (
                  <div key={`${account.id}-${c.platform}`} className="ah-conn-row">
                    {i === 0 ? (
                      <div className="ah-conn-account">
                        <div className="ah-account-swatch" style={{background: account.color, height: 24}}/>
                        <div>
                          <span className="ah-account-name" style={{fontSize:15}}>{account.name}</span>
                          <span className="ah-account-meta">{account.currency} · {conns.length} plataformas</span>
                        </div>
                      </div>
                    ) : (
                      <div className="ah-conn-account">
                        <div style={{width:8,height:24,marginLeft:0,opacity:0.15,background:account.color}}/>
                        <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--cm-ink-40)"}}>↳</span>
                      </div>
                    )}

                    <div className="ah-conn-platform">
                      <ChannelMark platform={c.platform}/>
                      <div>
                        <span className="ah-conn-platform-name">{D_CONN.PLATFORM_LABELS[c.platform].name}</span>
                        <span className="ah-conn-platform-id">
                          {c.externalId
                            ? c.externalId
                            : <span style={{color:"var(--ah-warn)"}}>—</span>}
                        </span>
                      </div>
                    </div>

                    <div className="ah-conn-sync">
                      {c.status === "ok" && (
                        <>
                          <span style={{color:"var(--cm-ink)"}}>Sync exitoso</span>
                          <span className="ah-conn-sync-time">{c.lastSync}</span>
                        </>
                      )}
                      {c.status === "error" && (
                        <>
                          <span style={{color:"var(--ah-crit)"}}>{c.lastError}</span>
                          <span className="ah-conn-sync-time">Falló: {c.lastSync}</span>
                        </>
                      )}
                      {c.status === "unset" && (
                        <span style={{color:"var(--cm-ink-40)"}}>Sin token configurado</span>
                      )}
                    </div>

                    <div>
                      <ConnectionStatusBadge status={c.status}/>
                    </div>

                    <div className="ah-conn-actions">
                      <button className="ah-icon-btn" aria-label="Acciones" style={{width:30,height:30}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Inline form preview — KIBO Google Ads (re-autorizar) */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Editar conexión · KIBO — Google Ads</h2>
              <span className="ah-section-meta">
                <span style={{color:"var(--ah-crit)"}}>● Token expirado</span>
              </span>
            </div>

            <div className="ah-conn-form">
              <div className="ah-conn-form-head">
                <ChannelMark platform="google_ads"/>
                <h3 style={{marginTop:14}}>Google Ads API</h3>
                <p>Customer ID + refresh token vía OAuth2. El developer token y client credentials viven en variables de entorno.</p>
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
                  <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--cm-ink-40)"}}>Documentación</span>
                  <a className="ah-btn-ghost" style={{padding:0,border:"none",background:"none",color:"var(--cm-ink-60)",fontSize:12,fontFamily:"var(--cm-mono)"}}>developers.google.com/google-ads ↗</a>
                </div>
              </div>

              <div className="ah-conn-form-fields">
                <div className="ah-field">
                  <label className="ah-field-label">Customer ID</label>
                  <div className="ah-field-input">
                    <input defaultValue="364-518-2936" placeholder="XXX-XXX-XXXX"/>
                  </div>
                  <span className="ah-field-help">Formato con guiones. Se almacena sin guiones en DB.</span>
                </div>

                <div className="ah-field">
                  <label className="ah-field-label">Refresh token</label>
                  <div className="ah-field-input">
                    <input type="password" defaultValue="●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●"/>
                    <button>Mostrar</button>
                    <button>Re-autorizar OAuth</button>
                  </div>
                  <span className="ah-field-help">El token actual expiró. Re-autoriza para reanudar el sync automático.</span>
                </div>

                <div className="ah-field">
                  <label className="ah-field-label">Manager Account (MCC)</label>
                  <div className="ah-field-input">
                    <input defaultValue="918-273-4651" placeholder="Opcional · sólo si la cuenta es de tercero"/>
                  </div>
                </div>

                <div className="ah-form-foot">
                  <span className="ah-test-result">
                    <span className="ah-mini-status is-crit"/>
                    <span>Última prueba falló · 26 abr 06:11 · INVALID_REFRESH_TOKEN</span>
                  </span>
                  <div style={{display:"flex",gap:10}}>
                    <button className="ah-btn-ghost">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 2v6h-6"/></svg>
                      Probar conexión
                    </button>
                    <button className="ah-btn">Guardar cambios</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.Connections = Connections;
