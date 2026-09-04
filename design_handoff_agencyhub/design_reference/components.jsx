// Shared components — Sidebar, BrowserChrome, Topbar, common UI
const { useState, useMemo } = React;
const D = window.AH_DATA;

// ── Browser window chrome ────────────────────────────────────────────────
function BrowserChrome({ url, title, children, screenLabel }) {
  return (
    <div className="bw-frame" data-screen-label={screenLabel}>
      <div className="bw-bar">
        <div className="bw-traffic"><span></span><span></span><span></span></div>
        <div className="bw-tabs">
          <div className="bw-tab is-active">
            <svg className="bw-tab-fav" viewBox="0 0 16 16" fill="none">
              <circle cx="3" cy="4" r="1.5" fill="#7866FA"/>
              <circle cx="13" cy="4" r="1.5" fill="#7866FA"/>
              <rect x="4.5" y="3.5" width="7" height="1" fill="#7866FA"/>
              <circle cx="3" cy="12" r="1.5" fill="#7866FA"/>
              <circle cx="13" cy="12" r="1.5" fill="#7866FA"/>
              <rect x="4.5" y="11.5" width="7" height="1" fill="#7866FA"/>
            </svg>
            <span>{title}</span>
          </div>
        </div>
        <div className="bw-url">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>{url}</span>
        </div>
      </div>
      <div className="bw-body">{children}</div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard",   label: "Dashboard",    section: "main" },
  { id: "budgets",     label: "Presupuestos", section: "main" },
  { id: "connections", label: "Conexiones",   section: "main" },
  { id: "alerts",      label: "Alarmas",      section: "main", count: 7, countKind: "crit" },
  { id: "reports",     label: "Reportes",     section: "main" },
  { id: "users",       label: "Usuarios",     section: "admin" },
];

function Sidebar({ activeId }) {
  const main = NAV.filter(n => n.section === "main");
  const admin = NAV.filter(n => n.section === "admin");
  return (
    <aside className="ah-sidebar">
      <div className="ah-brand">
        <img src="assets/isotipo-transparente.webp" alt="" className="ah-brand-mark"/>
        <span className="ah-brand-name">AgencyHub</span>
        <span className="ah-brand-sub">v0.1</span>
      </div>
      <nav className="ah-nav">
        <div className="ah-nav-label">Operación</div>
        {main.map(n => (
          <button key={n.id} className={`ah-nav-item ${activeId === n.id ? "is-active" : ""}`}>
            <span>{n.label}</span>
            {n.count != null && (
              <span className={`ah-nav-count is-${n.countKind || ""}`}>{n.count}</span>
            )}
          </button>
        ))}
        <div className="ah-nav-label" style={{marginTop: 14}}>Administración</div>
        {admin.map(n => (
          <button key={n.id} className={`ah-nav-item ${activeId === n.id ? "is-active" : ""}`}>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="ah-sidebar-foot">
        <div className="ah-avatar">MV</div>
        <div>
          <div className="ah-user-name">M. Vergara</div>
          <div className="ah-user-role">Admin · Cluster</div>
        </div>
      </div>
    </aside>
  );
}

// ── Topbar (per screen) ───────────────────────────────────────────────────
function Topbar({ crumbs, monthLabel, onSync, alerts = 7, syncLabel = "Sincronizar todas" }) {
  return (
    <div className="ah-topbar">
      <div className="ah-topbar-left">
        <div className="ah-eyebrow">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="ah-slash">/</span>}
              {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="ah-topbar-right">
        <div className="ah-period">
          <button aria-label="Anterior">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6.5 2 3 5l3.5 3"/></svg>
          </button>
          <span className="ah-period-label">{monthLabel}</span>
          <button aria-label="Siguiente">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 2 7 5l-3.5 3"/></svg>
          </button>
        </div>
        <button className="ah-icon-btn" aria-label="Alarmas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          {alerts > 0 && <span className="ah-dot-badge"/>}
        </button>
        <button className="ah-btn" onClick={onSync}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          {syncLabel}
        </button>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ kind, children }) {
  return (
    <span className={`ah-badge is-${kind}`}>
      <span className="ah-badge-dot"/>
      {children}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ ratio, status, paceMarker }) {
  const pct = Math.min(ratio, 1.2) * 100;
  const cls = status === "crit" ? "is-crit" : status === "warn" ? "is-warn" : "is-ok";
  return (
    <div className="ah-progress">
      <div className={`ah-progress-fill ${cls}`} style={{ width: `${pct}%` }}/>
      {paceMarker != null && (
        <div className="ah-progress-marker" style={{ left: `${paceMarker * 100}%` }} title={`Esperado: ${(paceMarker*100).toFixed(0)}%`}/>
      )}
    </div>
  );
}

// ── Channel mark (square, brand color of platform) ────────────────────────
function ChannelMark({ platform }) {
  const cls = platform === "meta_ads" ? "meta" : platform === "google_ads" ? "google" : "other";
  const letter = platform === "meta_ads" ? "M" : platform === "google_ads" ? "G" : "·";
  return <span className={`ah-channel-mark ${cls}`}>{letter}</span>;
}

Object.assign(window, { BrowserChrome, Sidebar, Topbar, StatusBadge, ProgressBar, ChannelMark });
