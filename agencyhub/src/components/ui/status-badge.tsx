import type { BadgeKind } from "@/types";

interface StatusBadgeProps {
  kind: BadgeKind;
  label?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ kind, label, children }: StatusBadgeProps) {
  return (
    <span className={`ah-badge is-${kind}`}>
      <span className="ah-badge-dot" />
      {label ?? children}
    </span>
  );
}
