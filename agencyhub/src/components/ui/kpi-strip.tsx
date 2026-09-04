interface KPIProps {
  label: string;
  value: string;
  unit?: string;
  unitColor?: string;
  valueColor?: string;
  footer?: React.ReactNode;
}

export function KPI({ label, value, unit, unitColor, valueColor, footer }: KPIProps) {
  return (
    <div className="ah-kpi">
      <span className="ah-kpi-label">{label}</span>
      <span className="ah-kpi-value tabnum" style={valueColor ? { color: valueColor } : undefined}>
        {value}
        {unit && (
          <span className="ah-kpi-unit" style={unitColor ? { color: unitColor } : undefined}>
            {unit}
          </span>
        )}
      </span>
      {footer && <span className="ah-kpi-foot">{footer}</span>}
    </div>
  );
}

interface KPIStripProps {
  columns?: 4 | 6;
  children: React.ReactNode;
}

export function KPIStrip({ columns = 4, children }: KPIStripProps) {
  return (
    <div className={`ah-kpi-strip ${columns === 6 ? "ah-kpi-strip-6" : ""}`}>
      {children}
    </div>
  );
}
