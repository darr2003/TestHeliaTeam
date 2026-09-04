import type { Status } from "@/types";

interface ProgressBarProps {
  ratio: number;
  status: Status;
  paceMarker?: number;
}

export function ProgressBar({ ratio, status, paceMarker }: ProgressBarProps) {
  const pct = Math.min(ratio, 1.2) * 100;
  const cls = status === "crit" ? "is-crit" : status === "warn" ? "is-warn" : "is-ok";
  return (
    <div className="ah-progress">
      <div className={`ah-progress-fill ${cls}`} style={{ width: `${pct}%` }} />
      {paceMarker != null && (
        <div
          className="ah-progress-marker"
          style={{ left: `${paceMarker * 100}%` }}
          title={`Esperado: ${(paceMarker * 100).toFixed(0)}%`}
        />
      )}
    </div>
  );
}
