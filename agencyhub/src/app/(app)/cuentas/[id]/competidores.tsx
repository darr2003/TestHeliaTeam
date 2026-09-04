"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui";
import { addCompetitor, deleteCompetitor } from "../actions";

export interface CompetitorRow {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
}

export function Competidores({
  accountId,
  competitors,
}: {
  accountId: string;
  competitors: CompetitorRow[];
}) {
  const [state, formAction, pending] = useActionState(addCompetitor, undefined);

  return (
    <div>
      <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Referencial. Estos competidores describen al cliente; el informe lo
        define el agente externo y puede cubrir un subconjunto distinto.
      </p>

      <div className="ah-table-wrap">
        <table className="ah-table">
          <thead>
            <tr>
              <th>Competidor</th>
              <th>Sitio web</th>
              <th>Notas</th>
              <th className="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="muted" style={{ fontSize: 12 }}>
                  {c.website ? (
                    <a href={c.website} target="_blank" rel="noopener noreferrer">
                      {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="muted" style={{ fontSize: 12 }}>
                  {c.notes || "—"}
                </td>
                <td className="num">
                  <button
                    className="ah-btn-ghost"
                    style={{ padding: "6px 12px", fontSize: 11 }}
                    onClick={() => deleteCompetitor(c.id)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {competitors.length === 0 && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                  Sin competidores cargados. No es bloqueante: el informe lo
                  define el agente externo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={formAction}
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          alignItems: "end",
        }}
      >
        <input type="hidden" name="accountId" value={accountId} />
        <Input id="comp-name" name="name" label="NUEVO COMPETIDOR" required />
        <Input
          id="comp-website"
          name="website"
          label="SITIO WEB"
          type="url"
          placeholder="https://"
        />
        <Input id="comp-notes" name="notes" label="NOTAS" />
        <div>
          <button type="submit" className="ah-btn" disabled={pending}>
            {pending ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="ah-field-error" style={{ marginTop: 12 }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
