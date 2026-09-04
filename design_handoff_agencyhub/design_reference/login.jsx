// Login screen — pre-auth, single panel centered
function Login() {
  return (
    <div style={{
      minHeight: 720,
      background: "var(--cm-paper)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Left — editorial side */}
      <div style={{
        padding: "56px 64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        background: "var(--cm-bone)",
        borderRight: "1px solid var(--cm-rule)",
      }}>
        {/* halo */}
        <div style={{
          position: "absolute",
          width: 500, height: 500,
          left: -120, bottom: -180,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(120,102,250,0.35), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}/>
        {/* crosshairs */}
        <div style={{position:"absolute",top:32,left:32,width:10,height:10}}>
          <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:"var(--cm-ink)"}}/>
          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:"var(--cm-ink)"}}/>
        </div>
        <div style={{position:"absolute",top:32,right:32,width:10,height:10}}>
          <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:"var(--cm-ink)"}}/>
          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:"var(--cm-ink)"}}/>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
          <img src="assets/isotipo-transparente.webp" alt="" style={{width:24,height:24}}/>
          <span style={{fontFamily:"var(--cm-mono)",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase"}}>AgencyHub</span>
          <span style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",color:"var(--cm-ink-40)",marginLeft:"auto",textTransform:"uppercase"}}>STGO · CL · 2026</span>
        </div>

        <div style={{position:"relative"}}>
          <div className="ah-eyebrow" style={{marginBottom:24}}>
            <span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>
            CONTROL DE GASTO · INTERNO
          </div>
          <h1 style={{
            fontFamily:"var(--cm-sans)",
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: "-0.035em",
            lineHeight: 0.94,
            margin: 0,
            textWrap: "balance",
          }}>
            Plan vs <span style={{fontWeight:200,fontStyle:"italic",color:"#7866FA"}}>real</span>, sin planillas<span style={{display:"inline-block",width:"0.16em",height:"0.16em",background:"#7866FA",borderRadius:"50%",marginLeft:"0.06em",transform:"translateY(-0.1em)"}}/>
          </h1>
          <p style={{
            fontSize: 16,
            color: "var(--cm-ink-60)",
            marginTop: 24,
            maxWidth: "44ch",
            lineHeight: 1.5,
          }}>
            Visibilidad centralizada de gasto en Meta Ads y Google Ads, todas las cuentas. Sync cada 4 horas, alarmas automáticas, reportes mensuales.
          </p>
        </div>

        <div style={{display:"flex",gap:24,fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--cm-ink-40)",position:"relative"}}>
          <span>15 cuentas</span>
          <span>·</span>
          <span>2 plataformas</span>
          <span>·</span>
          <span>Sync 4 h</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{padding:"56px 64px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{maxWidth: 380, width:"100%", margin:"0 auto"}}>
          <div className="ah-eyebrow" style={{marginBottom:18}}>
            <span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>
            ACCESO · CLUSTER MEDIA
          </div>
          <h2 style={{
            fontFamily:"var(--cm-sans)",
            fontWeight:700,
            fontSize:32,
            letterSpacing:"-0.025em",
            margin:"0 0 8px",
          }}>Iniciar sesión.</h2>
          <p style={{fontSize:14,color:"var(--cm-ink-60)",margin:"0 0 32px"}}>
            Sin registro público. Si necesitas acceso, pídeselo a tu administrador.
          </p>

          <form style={{display:"flex",flexDirection:"column",gap:18}}>
            <div className="ah-field">
              <label className="ah-field-label">Correo electrónico</label>
              <div className="ah-field-input">
                <input type="email" defaultValue="m.vergara@clustermedia.cl" placeholder="tu@clustermedia.cl"/>
              </div>
            </div>

            <div className="ah-field">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <label className="ah-field-label">Contraseña</label>
                <button type="button" style={{fontFamily:"var(--cm-mono)",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--cm-ink-40)"}}>¿Olvidaste? ↗</button>
              </div>
              <div className="ah-field-input">
                <input type="password" defaultValue="••••••••••••" placeholder="••••••••••••"/>
                <button type="button">Mostrar</button>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
              <span style={{
                width:16,height:16,
                border:"1px solid var(--cm-ink)",
                borderRadius:3,
                background:"var(--cm-ink)",
                display:"grid",placeItems:"center",
              }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2"><path d="M3 8l3 3 7-7"/></svg>
              </span>
              <span style={{fontSize:13,color:"var(--cm-ink-60)"}}>Mantener sesión iniciada</span>
            </div>

            <button type="submit" className="ah-btn" style={{justifyContent:"center",padding:"16px 26px",marginTop:8}}>
              Entrar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </form>

          <div style={{
            marginTop:48,
            paddingTop:24,
            borderTop:"1px solid var(--cm-rule)",
            display:"flex",
            justifyContent:"space-between",
            fontFamily:"var(--cm-mono)",
            fontSize:10,
            letterSpacing:"0.14em",
            textTransform:"uppercase",
            color:"var(--cm-ink-40)",
          }}>
            <span>v0.1 · MVP</span>
            <span>contacto@clustermedia.cl</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Login = Login;
