"use client";

interface TopbarProps {
  crumbs: string[];
  monthLabel: string;
  alertCount?: number;
  syncLabel?: string;
  onSync?: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** La campana pertenece al modulo de gasto; apagada salvo que se pida. */
  showAlerts?: boolean;
  /** Por defecto sigue a `onSync`; explicito solo para el showcase de /demo. */
  showSync?: boolean;
}

export function Topbar({
  crumbs,
  monthLabel,
  alertCount = 0,
  syncLabel = "Sincronizar todas",
  onSync,
  onPrevMonth,
  onNextMonth,
  showAlerts = false,
  showSync,
}: TopbarProps) {
  // Un `monthLabel` vacio es la senal que ya usaban las paginas sin periodo.
  const showPeriod = monthLabel !== "";
  const withSync = showSync ?? onSync !== undefined;
  return (
    <div className="ah-topbar">
      <div className="ah-topbar-left">
        <div className="ah-eyebrow">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="ah-slash">/</span>}
              {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="ah-topbar-right">
        {showPeriod && (
          <div className="ah-period">
            <button aria-label="Anterior" onClick={onPrevMonth}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6.5 2 3 5l3.5 3" />
              </svg>
            </button>
            <span className="ah-period-label">{monthLabel}</span>
            <button aria-label="Siguiente" onClick={onNextMonth}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M3.5 2 7 5l-3.5 3" />
              </svg>
            </button>
          </div>
        )}
        {showAlerts && (
          <button className="ah-icon-btn" aria-label="Alarmas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {alertCount > 0 && <span className="ah-dot-badge" />}
          </button>
        )}
        {withSync && (
          <button className="ah-btn" onClick={onSync}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            {syncLabel}
          </button>
        )}
      </div>
    </div>
  );
}
