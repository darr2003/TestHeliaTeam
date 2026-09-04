"use client";

import { toggleUserActive } from "./actions";

export function ToggleUserButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  return (
    <button
      className="ah-btn-ghost"
      style={{ padding: "6px 12px", fontSize: 11 }}
      onClick={() => toggleUserActive(userId, isActive)}
    >
      {isActive ? "Desactivar" : "Activar"}
    </button>
  );
}
