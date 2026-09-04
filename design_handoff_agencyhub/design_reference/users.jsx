// Users screen — admin only
const USERS = [
  { name:"M. Vergara",    email:"m.vergara@clustermedia.cl",    role:"admin",  active:true,  last:"hace 5 min", initials:"MV" },
  { name:"S. Donoso",     email:"s.donoso@clustermedia.cl",     role:"admin",  active:true,  last:"hace 2 h",   initials:"SD" },
  { name:"J. Riquelme",   email:"j.riquelme@clustermedia.cl",   role:"editor", active:true,  last:"hace 1 h",   initials:"JR" },
  { name:"C. Pavez",      email:"c.pavez@clustermedia.cl",      role:"editor", active:true,  last:"hace 30 min",initials:"CP" },
  { name:"A. Tapia",      email:"a.tapia@clustermedia.cl",      role:"editor", active:true,  last:"ayer",       initials:"AT" },
  { name:"R. Espinoza",   email:"r.espinoza@clustermedia.cl",   role:"editor", active:false, last:"hace 14 días",initials:"RE" },
];

function Users() {
  return (
    <div className="ah-app">
      <Sidebar activeId="users"/>
      <main className="ah-main">
        <Topbar
          crumbs={["AGENCYHUB", "USUARIOS"]}
          monthLabel="ABR · 2026"
          alerts={7}
          syncLabel="Invitar usuario"
        />
        <div className="ah-content">
          <div className="ah-page-head">
            <div>
              <div className="ah-eyebrow"><span style={{display:"inline-block",width:20,height:1,background:"#7866FA",marginRight:10,verticalAlign:"middle"}}/>07 / USUARIOS</div>
              <h1 className="ah-page-title">Equipo Cluster <span className="cm-thin">con acceso</span><span className="cm-dot"/></h1>
              <p className="ah-page-sub">Sin registro público. Sólo admins pueden invitar, editar roles y desactivar.</p>
            </div>
          </div>

          <div className="ah-kpi-strip">
            <div className="ah-kpi"><span className="ah-kpi-label">Activos</span><span className="ah-kpi-value tabnum">{USERS.filter(u=>u.active).length}</span><span className="ah-kpi-foot"><span>De {USERS.length} totales</span></span></div>
            <div className="ah-kpi"><span className="ah-kpi-label">Admins</span><span className="ah-kpi-value tabnum">{USERS.filter(u=>u.role==="admin"&&u.active).length}</span><span className="ah-kpi-foot"><span>Acceso total</span></span></div>
            <div className="ah-kpi"><span className="ah-kpi-label">Editores</span><span className="ah-kpi-value tabnum">{USERS.filter(u=>u.role==="editor"&&u.active).length}</span><span className="ah-kpi-foot"><span>Sin gestión de conexiones</span></span></div>
            <div className="ah-kpi"><span className="ah-kpi-label">Inactivos</span><span className="ah-kpi-value tabnum" style={{color:"var(--cm-ink-40)"}}>{USERS.filter(u=>!u.active).length}</span><span className="ah-kpi-foot"><span>Pueden reactivarse</span></span></div>
          </div>

          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Miembros</h2>
              <span className="ah-section-meta">Ordenados por rol · admins primero</span>
            </div>
            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Último acceso</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map(u => (
                    <tr key={u.email} style={{opacity: u.active ? 1 : 0.55}}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div className="ah-avatar" style={{width:32,height:32,fontSize:12}}>{u.initials}</div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td className="muted" style={{fontFamily:"var(--cm-mono)",fontSize:12}}>{u.email}</td>
                      <td>
                        {u.role === "admin"
                          ? <StatusBadge kind="ghost"><span style={{color:"var(--cm-accent)"}}>● Admin</span></StatusBadge>
                          : <StatusBadge kind="ghost">Editor</StatusBadge>}
                      </td>
                      <td className="muted" style={{fontFamily:"var(--cm-mono)",fontSize:12}}>{u.last}</td>
                      <td>{u.active ? <StatusBadge kind="ok">Activo</StatusBadge> : <StatusBadge kind="ghost">Inactivo</StatusBadge>}</td>
                      <td style={{textAlign:"right"}}>
                        <button className="ah-btn-ghost" style={{padding:"6px 12px",fontSize:11}}>Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permisos por rol */}
          <div className="ah-section">
            <div className="ah-section-head">
              <h2 className="ah-section-title">Permisos por rol</h2>
              <span className="ah-section-meta">Hardcoded en MVP · configurable en fase posterior</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,border:"1px solid var(--cm-rule)"}}>
              {[
                { role:"Admin", color:"var(--cm-accent)", perms:[
                  ["Usuarios","CRUD completo"],["Cuentas","CRUD completo"],["Presupuestos","CRUD completo"],
                  ["Conexiones","CRUD + tokens"],["Sync manual","Global y por cuenta"],["Alarmas","Descartar"],
                ]},
                { role:"Editor", color:"var(--cm-ink-60)", perms:[
                  ["Usuarios","—"],["Cuentas","Solo lectura"],["Presupuestos","CRUD completo"],
                  ["Conexiones","Solo lectura"],["Sync manual","Por cuenta"],["Alarmas","Marcar leídas"],
                ]},
              ].map((r,i) => (
                <div key={r.role} style={{padding:"24px 28px",borderRight: i===0?"1px solid var(--cm-rule)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:r.color}}/>
                    <span style={{fontFamily:"var(--cm-mono)",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600}}>{r.role}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    {r.perms.map(([k,v],j) => (
                      <div key={k} style={{display:"grid",gridTemplateColumns:"140px 1fr",padding:"10px 0",borderBottom: j<r.perms.length-1?"1px solid var(--cm-rule)":"none",fontSize:13}}>
                        <span style={{color:"var(--cm-ink-60)"}}>{k}</span>
                        <span style={{fontFamily:"var(--cm-mono)",fontSize:12,color: v==="—"?"var(--cm-ink-40)":"var(--cm-ink)"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

window.Users = Users;
