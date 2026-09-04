// Reports screen — vista de reporte mensual exportable
const D_RPT = window.AH_DATA;

function Reports() {
  const acc = D_RPT.ACCOUNTS.find(a => a.id === "chc");
  const t = D_RPT.accountTotals(acc);

  return (
    <div className="ah-app">
      <Sidebar activeId="reports"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "REPORTES", "CHC · ABRIL 2026"]}
          monthLabel="ABR · 2026"
          alerts={7}
          syncLabel="Exportar PDF"
        />
        <div className="ah-content">

          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>06 / REPORTE MENSUAL</div>
              <h1 className="ah-page-title">CHC · <span className="cm-thin">abril</span> 2026<span className="cm-dot"/></h1>
              <p className="ah-page-sub">Vista del reporte tal como se exporta. PDF para cliente, CSV para análisis interno.</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="ah-btn-ghost">Exportar CSV</button>
              <button className="ah-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Hoja de reporte */}
          <div style={{
            border:"1px solid var(--cm-rule)",
            background:"var(--cm-paper)",
            padding:"56px 64px",
            display:"flex",
            flexDirection:"column",
            gap:32,
          }}>
            {/* Header del documento */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid var(--cm-rule)",paddingBottom:24}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <img src="assets/isotipo-transparente.webp" style={{width:24,height:24}}/>
                  <span style={{fontFamily:"var(--cm-mono)",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase"}}>Cluster Media</span>
                </div>
                <h2 style={{fontFamily:"var(--cm-sans)",fontWeight:800,fontSize:48,letterSpacing:"-0.035em",lineHeight:0.95,margin:0}}>
                  Reporte de gasto<span style={{display:"inline-block",width:"0.16em",height:"0.16em",background:"#7866FA",borderRadius:"50%",marginLeft:"0.06em",transform:"translateY(-0.1em)"}}/>
                </h2>
                <div style={{display:"flex",alignItems:"center",gap:10,marginTop:14}}>
                  <div style={{width:5,height:22,background:acc.color,borderRadius:1}}/>
                  <span style={{fontSize:18,fontWeight:600}}>{acc.fullName}</span>
                  <span style={{fontFamily:"var(--cm-mono)",fontSize:11,letterSpacing:"0.14em",color:"var(--cm-ink-40)",textTransform:"uppercase",marginLeft:8}}>ABR · 2026 · CLP</span>
                </div>
              </div>
              <div style={{textAlign:"right",fontFamily:"var(--cm-mono)",fontSize:11,letterSpacing:"0.06em",color:"var(--cm-ink-40)"}}>
                <div>EMITIDO · 26 ABR 2026</div>
                <div style={{marginTop:4}}>v1 · INTERNO</div>
              </div>
            </div>

            {/* Resumen ejecutivo */}
            <div>
              <div className="ah-eyebrow" style={{marginBottom:14}}><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>RESUMEN EJECUTIVO</div>
              <p style={{fontSize:20,lineHeight:1.55,color:"var(--cm-ink)",fontWeight:300,margin:0,maxWidth:"60ch",textWrap:"pretty"}}>
                Al día 22 de 30, CHC ejecuta un <strong style={{fontWeight:600}}>91.4%</strong> del presupuesto mensual planificado, con ritmo dentro del rango esperado en Google Ads y <span style={{color:"var(--ah-warn)",fontWeight:500}}>acelerado en Meta Ads</span>.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0,marginTop:28,border:"1px solid var(--cm-rule)"}}>
                {[
                  {l:"Plan", v:"$3.5M", s:"2 canales · CLP"},
                  {l:"Real al día 22", v:"$3.2M", s:"91.4% ejecución"},
                  {l:"Disponible", v:"$300K", s:"~8 días al ritmo actual"},
                ].map((x,i) => (
                  <div key={i} style={{padding:"22px 24px",borderRight: i<2?"1px solid var(--cm-rule)":"none"}}>
                    <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--cm-ink-40)",display:"block"}}>{x.l}</span>
                    <span style={{fontFamily:"var(--cm-sans)",fontWeight:200,fontSize:44,letterSpacing:"-0.04em",lineHeight:1,fontVariantNumeric:"tabular-nums",display:"block",marginTop:8}}>{x.v}</span>
                    <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.06em",color:"var(--cm-ink-40)",display:"block",marginTop:8,textTransform:"uppercase"}}>{x.s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla por canal */}
            <div>
              <div className="ah-eyebrow" style={{marginBottom:14}}><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>POR CANAL</div>
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th className="num">Plan</th>
                    <th className="num">Real</th>
                    <th className="num">Δ</th>
                    <th className="num">% Ejec.</th>
                  </tr>
                </thead>
                <tbody>
                  {acc.channels.map(ch => {
                    const delta = ch.spent - ch.planned;
                    return (
                      <tr key={ch.platform}>
                        <td>
                          <span className="ah-table-channel"><ChannelMark platform={ch.platform}/>{D_RPT.PLATFORM_LABELS[ch.platform].name}</span>
                        </td>
                        <td className="num">{D_RPT.fmtCLP(ch.planned)}</td>
                        <td className="num">{D_RPT.fmtCLP(ch.spent)}</td>
                        <td className="num"><span className={`ah-delta ${delta>=0?"is-neg":"is-pos"}`}>{delta>=0?"+":""}{D_RPT.fmtCLP(delta)}</span></td>
                        <td className="num"><strong>{((ch.spent/ch.planned)*100).toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                  <tr className="is-total">
                    <td>Total</td>
                    <td className="num">{D_RPT.fmtCLP(t.planned)}</td>
                    <td className="num">{D_RPT.fmtCLP(t.spent)}</td>
                    <td className="num">{D_RPT.fmtCLP(t.spent-t.planned)}</td>
                    <td className="num">{((t.spent/t.planned)*100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Alertas del período */}
            <div>
              <div className="ah-eyebrow" style={{marginBottom:14}}><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>ALERTAS DEL PERÍODO</div>
              <div style={{display:"flex",flexDirection:"column",gap:0,borderTop:"1px solid var(--cm-rule)"}}>
                {[
                  {sev:"warn", t:"22 abr · Meta Ads alcanzó 95% del presupuesto mensual."},
                  {sev:"warn", t:"18 abr · Ritmo Meta Ads acelerado (1.21× del esperado)."},
                  {sev:"ok",   t:"05 abr · Sincronización automática estable durante todo el mes."},
                ].map((a,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:"1px solid var(--cm-rule)"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background: a.sev==="warn"?"var(--ah-warn)":"var(--ah-ok)",flexShrink:0}}/>
                    <span style={{fontSize:14,color:"var(--cm-ink)"}}>{a.t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{borderTop:"1px solid var(--cm-rule)",paddingTop:18,display:"flex",justifyContent:"space-between",fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",color:"var(--cm-ink-40)",textTransform:"uppercase"}}>
              <span>Cluster Media · contacto@clustermedia.cl</span>
              <span>Fuente: Meta Marketing API + Google Ads API · Sync 26 abr 14:32</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.Reports = Reports;
