"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { toggleConnection, deleteConnection, testConnection } from "./actions";
import { NewConnectionForm } from "./new-form";
import { SyncButton } from "./sync-button";

interface SyncLogEntry {
  id: string;
  syncType: string;
  status: string;
  recordsSynced: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface ConnectionRow {
  id: string;
  accountId: string;
  accountName: string;
  accountColor: string;
  platform: string;
  externalAccountId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  createdAt: string;
  syncLogs: SyncLogEntry[];
}

interface Account {
  id: string;
  name: string;
  currency: string;
}

const PLATFORM_NAMES: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function syncStatusBadge(status: string) {
  if (status === "success") return <StatusBadge kind="ok" label="OK" />;
  if (status === "error") return <StatusBadge kind="crit" label="Error" />;
  if (status === "pending") return <StatusBadge kind="ghost" label="Pendiente" />;
  return <StatusBadge kind="ghost" label={status} />;
}

export function ConexionesView({
  connections,
  accounts,
}: {
  connections: ConnectionRow[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [logModal, setLogModal] = useState<ConnectionRow | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok?: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleConnection(id);
      router.refresh();
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar la conexión de ${name}?`)) return;
    startTransition(async () => {
      await deleteConnection(id);
      router.refresh();
    });
  };

  const handleTest = (id: string) => {
    setTestResult({ id });
    startTransition(async () => {
      const result = await testConnection(id);
      setTestResult({ id, ...result });
    });
  };

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Conexiones"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              PLATAFORMAS
            </div>
            <h1 className="ah-page-title">
              Conexiones<span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              {connections.length} conexión{connections.length !== 1 ? "es" : ""} configurada{connections.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SyncButton />
            <button className="ah-btn" onClick={() => setShowNew(true)}>
              Nueva conexión
            </button>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="ah-empty-state">
            <p>No hay conexiones configuradas aún.</p>
            <p style={{ color: "var(--cm-ink-40)", fontSize: 13, marginTop: 8 }}>
              Conecta tus cuentas de Meta Ads o Google Ads para sincronizar gasto automáticamente.
            </p>
          </div>
        ) : (
          <div className="ah-table-wrap">
            <table className="ah-table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Plataforma</th>
                  <th>ID externo</th>
                  <th>Estado</th>
                  <th>Última sync</th>
                  <th>Logs</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn) => (
                  <tr key={conn.id} style={{ opacity: conn.isActive ? 1 : 0.5 }}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: conn.accountColor,
                            flexShrink: 0,
                          }}
                        />
                        {conn.accountName}
                      </span>
                    </td>
                    <td>
                      <span className="ah-platform-tag">
                        {PLATFORM_NAMES[conn.platform] || conn.platform}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: 12, color: "var(--cm-ink-60)" }}>
                        {conn.externalAccountId}
                      </code>
                    </td>
                    <td>{syncStatusBadge(conn.lastSyncStatus)}</td>
                    <td style={{ fontSize: 12, color: "var(--cm-ink-60)" }}>
                      {fmtDate(conn.lastSyncAt)}
                      {conn.lastSyncError && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--ah-crit)",
                            marginTop: 2,
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={conn.lastSyncError}
                        >
                          {conn.lastSyncError}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="ah-link-btn"
                        onClick={() => setLogModal(conn)}
                      >
                        {conn.syncLogs.length} logs
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="ah-link-btn"
                          onClick={() => handleTest(conn.id)}
                          disabled={isPending}
                        >
                          Probar
                        </button>
                        <button
                          className="ah-link-btn"
                          onClick={() => handleToggle(conn.id)}
                          disabled={isPending}
                        >
                          {conn.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="ah-link-btn"
                          style={{ color: "var(--ah-crit)" }}
                          onClick={() => handleDelete(conn.id, conn.accountName)}
                          disabled={isPending}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Test result toast */}
        {testResult?.message && (
          <div
            className={`ah-toast ${testResult.ok ? "is-ok" : "is-crit"}`}
            onClick={() => setTestResult(null)}
          >
            <strong>{testResult.ok ? "Conexión OK" : "Error"}</strong>
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* New connection modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nueva conexión">
        <NewConnectionForm accounts={accounts} onClose={() => setShowNew(false)} />
      </Modal>

      {/* Sync logs modal */}
      {logModal && (
        <Modal
          open={!!logModal}
          onClose={() => setLogModal(null)}
          title={`Logs · ${logModal.accountName} · ${PLATFORM_NAMES[logModal.platform]}`}
        >
          {logModal.syncLogs.length === 0 ? (
            <p style={{ color: "var(--cm-ink-40)", fontSize: 13 }}>
              Sin registros de sincronización aún.
            </p>
          ) : (
            <div className="ah-table-wrap">
              <table className="ah-table ah-table-compact">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Registros</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logModal.syncLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12 }}>{fmtDate(log.startedAt)}</td>
                      <td>
                        <span style={{ fontSize: 11, textTransform: "uppercase", color: "var(--cm-ink-40)" }}>
                          {log.syncType}
                        </span>
                      </td>
                      <td>{syncStatusBadge(log.status)}</td>
                      <td className="num">{log.recordsSynced}</td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--ah-crit)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={log.errorMessage || undefined}
                      >
                        {log.errorMessage || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
