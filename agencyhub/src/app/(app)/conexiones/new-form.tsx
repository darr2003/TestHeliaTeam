"use client";

import { useActionState } from "react";
import { createConnection } from "./actions";

interface Account {
  id: string;
  name: string;
  currency: string;
}

export function NewConnectionForm({
  accounts,
  onClose,
}: {
  accounts: Account[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createConnection, undefined);

  return (
    <form action={formAction}>
      <div className="ah-form-grid">
        <div className="ah-field">
          <label className="ah-label" htmlFor="accountId">
            Cuenta
          </label>
          <select id="accountId" name="accountId" className="ah-input" required>
            <option value="">Seleccionar cuenta...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
        </div>

        <div className="ah-field">
          <label className="ah-label" htmlFor="platform">
            Plataforma
          </label>
          <select id="platform" name="platform" className="ah-input" required>
            <option value="">Seleccionar...</option>
            <option value="meta_ads">Meta Ads</option>
            <option value="google_ads">Google Ads</option>
          </select>
        </div>

        <div className="ah-field">
          <label className="ah-label" htmlFor="externalAccountId">
            ID de cuenta externa
          </label>
          <input
            id="externalAccountId"
            name="externalAccountId"
            className="ah-input"
            placeholder="Ej: act_123456789 o 123-456-7890"
            required
          />
          <span className="ah-hint">
            Meta: act_XXXXXXX · Google: XXX-XXX-XXXX
          </span>
        </div>

        <div className="ah-field">
          <label className="ah-label" htmlFor="accessToken">
            Access Token
          </label>
          <textarea
            id="accessToken"
            name="accessToken"
            className="ah-input"
            rows={3}
            placeholder="Token de acceso de la plataforma"
            required
            style={{ fontFamily: "var(--cm-mono)", fontSize: 12 }}
          />
        </div>

        <div className="ah-field">
          <label className="ah-label" htmlFor="refreshToken">
            Refresh Token <span style={{ color: "var(--cm-ink-40)" }}>(opcional)</span>
          </label>
          <textarea
            id="refreshToken"
            name="refreshToken"
            className="ah-input"
            rows={2}
            placeholder="Solo Google Ads — para renovar el access token"
            style={{ fontFamily: "var(--cm-mono)", fontSize: 12 }}
          />
        </div>
      </div>

      {state?.error && (
        <div className="ah-form-error">{state.error}</div>
      )}

      <div className="ah-modal-footer">
        <button type="button" className="ah-btn ah-btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="ah-btn" disabled={isPending}>
          {isPending ? "Guardando…" : "Crear conexión"}
        </button>
      </div>
    </form>
  );
}
