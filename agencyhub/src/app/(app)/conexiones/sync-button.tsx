"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runSyncAll } from "./actions";

export function SyncButton() {
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    setResult(null);
    startTransition(async () => {
      const res = await runSyncAll();
      setResult({ ok: res.ok, message: res.message });
      router.refresh();
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="ah-btn ah-btn-accent"
        onClick={handleSync}
        disabled={isPending}
      >
        {isPending ? "Sincronizando…" : "Sincronizar ahora"}
      </button>
      {result && (
        <div
          className={`ah-toast-inline ${result.ok ? "is-ok" : "is-crit"}`}
          onClick={() => setResult(null)}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
