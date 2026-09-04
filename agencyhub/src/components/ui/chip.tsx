"use client";

interface ChipProps {
  active?: boolean;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Chip({ active, count, onClick, children }: ChipProps) {
  return (
    <button className={`ah-chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
      {count != null && <span className="ah-chip-count">{count}</span>}
    </button>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <div className="ah-filterbar">{children}</div>;
}
