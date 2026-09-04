"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui";
import { markAlertRead, dismissAlert, markAllRead, dismissAllRead } from "./actions";

interface AlertRow {
  id: string;
  accountId: string;
  accountName: string;
  accountColor: string;
  platform: string | null;
  alertType: string;
  severity: string;
  message: string;
  thresholdValue: number;
  currentValue: number;
  isRead: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  overspend: "Sobregasto",
  low_budget: "Subgasto",
  abnormal_pace: "Ritmo anormal",
  connection_error: "Error conexión",
};

const TYPE_ICONS: Record<string, string> = {
  overspend: "↑",
  low_budget: "↓",
  abnormal_pace: "⚡",
  connection_error: "⚠",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlarmasView({
  alerts,
  unreadCount,
}: {
  alerts: AlertRow[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"todas" | "criticas" | "leidas">("todas");
  const [isPending, startTransition] = useTransition();
  const [evaluating, setEvaluating] = useState(false);

  const visible =
    filter === "criticas"
      ? alerts.filter((a) => a.severity === "critical")
      : filter === "leidas"
        ? alerts.filter((a) => !a.isRead)
        : alerts;

  const critCount = alerts.filter((a) => a.severity === "critical").length;

  const handleRead = (id: string) => {
    startTransition(async () => {
      await markAlertRead(id);
      router.refresh();
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      await dismissAlert(id);
      router.refresh();
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllRead();
      router.refresh();
    });
  };

  const handleDismissAllRead = () => {
    if (!confirm("¿Descartar todas las alertas leídas?")) return;
    startTransition(async () => {
      await dismissAllRead();
      router.refresh();
    });
  };

  return (
    <>
      <Topbar crumbs={["AgencyHub", "Alarmas"]} monthLabel="" />
      <div className="ah-content">
        <div className="ah-page-head">
          <div>
            <div className="ah-eyebrow">
              <span className="ah-eyebrow-line" />
              MONITOREO
            </div>
            <h1 className="ah-page-title">
              Alarmas<span className="cm-dot" />
            </h1>
            <p className="ah-page-sub">
              {alerts.length} alerta{alerts.length !== 1 ? "s" : ""} activa{alerts.length !== 1 ? "s" : ""}
              {unreadCount > 0 && ` · ${unreadCount} sin leer`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="ah-btn ah-btn-accent"
              disabled={evaluating}
              onClick={async () => {
                setEvaluating(true);
                try {
                  await fetch("/api/alerts", { method: "POST" });
                  router.refresh();
                } finally {
                  setEvaluating(false);
                }
              }}
            >
              {evaluating ? "Evaluando…" : "Evaluar alertas"}
            </button>
            {unreadCount > 0 && (
              <button
                className="ah-btn ah-btn-ghost"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                Marcar todas leídas
              </button>
            )}
            {alerts.some((a) => a.isRead) && (
              <button
                className="ah-btn ah-btn-ghost"
                onClick={handleDismissAllRead}
                disabled={isPending}
              >
                Descartar leídas
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="ah-filterbar" style={{ marginBottom: 20 }}>
          <button
            className={`ah-chip ${filter === "todas" ? "is-active" : ""}`}
            onClick={() => setFilter("todas")}
          >
            Todas <span className="ah-chip-count">{alerts.length}</span>
          </button>
          <button
            className={`ah-chip ${filter === "criticas" ? "is-active" : ""}`}
            onClick={() => setFilter("criticas")}
          >
            Críticas <span className="ah-chip-count">{critCount}</span>
          </button>
          <button
            className={`ah-chip ${filter === "leidas" ? "is-active" : ""}`}
            onClick={() => setFilter("leidas")}
          >
            Sin leer <span className="ah-chip-count">{unreadCount}</span>
          </button>
        </div>

        {/* Alert list */}
        {visible.length === 0 ? (
          <div className="ah-empty-state">
            <p>No hay alarmas activas.</p>
            <p style={{ color: "var(--cm-ink-40)", fontSize: 13, marginTop: 8 }}>
              Las alarmas se generan automáticamente al sincronizar cuando se detectan anomalías.
            </p>
          </div>
        ) : (
          <div className="ah-alert-list">
            {visible.map((alert) => (
              <div
                key={alert.id}
                className={`ah-alert-card ${!alert.isRead ? "is-unread" : ""} is-${alert.severity}`}
              >
                <div className="ah-alert-icon">
                  {TYPE_ICONS[alert.alertType] || "•"}
                </div>
                <div className="ah-alert-body">
                  <div className="ah-alert-head">
                    <span className="ah-alert-account">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: alert.accountColor,
                          display: "inline-block",
                          marginRight: 6,
                        }}
                      />
                      {alert.accountName}
                    </span>
                    <StatusBadge
                      kind={alert.severity === "critical" ? "crit" : "warn"}
                      label={alert.severity === "critical" ? "Crítico" : "Atención"}
                    />
                    <span className="ah-alert-type">
                      {TYPE_LABELS[alert.alertType] || alert.alertType}
                    </span>
                  </div>
                  <p className="ah-alert-message">{alert.message}</p>
                  <span className="ah-alert-time">{fmtDate(alert.createdAt)}</span>
                </div>
                <div className="ah-alert-actions">
                  {!alert.isRead && (
                    <button
                      className="ah-link-btn"
                      onClick={() => handleRead(alert.id)}
                      disabled={isPending}
                    >
                      Marcar leída
                    </button>
                  )}
                  <button
                    className="ah-link-btn"
                    style={{ color: "var(--cm-ink-40)" }}
                    onClick={() => handleDismiss(alert.id)}
                    disabled={isPending}
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
