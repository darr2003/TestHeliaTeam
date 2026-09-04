"use client";

import { toggleAccountActive } from "./actions";

export function ToggleAccountButton({
  accountId,
  isActive,
}: {
  accountId: string;
  isActive: boolean;
}) {
  return (
    <button
      className="ah-btn-ghost"
      style={{ padding: "6px 12px", fontSize: 11 }}
      onClick={() => toggleAccountActive(accountId)}
    >
      {isActive ? "Desactivar" : "Activar"}
    </button>
  );
}
