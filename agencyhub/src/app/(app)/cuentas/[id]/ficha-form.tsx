"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui";
import { updateAccountFicha } from "../actions";

export interface FichaData {
  id: string;
  name: string;
  color: string;
  currency: string;
  legalName: string | null;
  industry: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  relationStart: string | null;
  notes: string | null;
}

export function FichaForm({ account }: { account: FichaData }) {
  const [state, formAction, pending] = useActionState(
    updateAccountFicha,
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="accountId" value={account.id} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <Input
          id="name"
          name="name"
          label="NOMBRE"
          defaultValue={account.name}
          required
          help="Como lo conoce el equipo. El agente lo usa para identificar al cliente."
        />
        <Input
          id="legalName"
          name="legalName"
          label="RAZÓN SOCIAL"
          defaultValue={account.legalName ?? ""}
        />
        <Input
          id="industry"
          name="industry"
          label="INDUSTRIA"
          defaultValue={account.industry ?? ""}
        />
        <Input
          id="website"
          name="website"
          label="SITIO WEB"
          type="url"
          placeholder="https://"
          defaultValue={account.website ?? ""}
        />
        <Input
          id="contactName"
          name="contactName"
          label="CONTACTO"
          defaultValue={account.contactName ?? ""}
        />
        <Input
          id="contactEmail"
          name="contactEmail"
          label="EMAIL"
          type="email"
          defaultValue={account.contactEmail ?? ""}
        />
        <Input
          id="contactPhone"
          name="contactPhone"
          label="TELÉFONO"
          defaultValue={account.contactPhone ?? ""}
        />
        <Input
          id="relationStart"
          name="relationStart"
          label="CLIENTE DESDE"
          type="date"
          defaultValue={account.relationStart ?? ""}
        />
        <Select
          id="currency"
          name="currency"
          label="MONEDA"
          defaultValue={account.currency}
        >
          <option value="CLP">CLP</option>
          <option value="USD">USD</option>
        </Select>
        <Input
          id="color"
          name="color"
          label="COLOR"
          type="color"
          defaultValue={account.color}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <Textarea
          id="notes"
          name="notes"
          label="NOTAS"
          rows={4}
          defaultValue={account.notes ?? ""}
        />
      </div>

      {state?.error && (
        <div className="ah-field-error" style={{ marginTop: 12 }}>
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div style={{ marginTop: 12, fontSize: 12 }} className="muted">
          Ficha guardada.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button type="submit" className="ah-btn" disabled={pending}>
          {pending ? "Guardando…" : "Guardar ficha"}
        </button>
      </div>
    </form>
  );
}
