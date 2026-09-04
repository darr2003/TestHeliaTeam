"use client";

import { deleteBudget } from "./actions";

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  return (
    <button
      className="ah-btn-ghost"
      style={{ padding: "6px 12px", fontSize: 11 }}
      onClick={() => {
        if (confirm("¿Eliminar este presupuesto?")) {
          deleteBudget(budgetId);
        }
      }}
    >
      Eliminar
    </button>
  );
}
