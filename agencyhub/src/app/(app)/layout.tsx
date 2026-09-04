import { requireAuth } from "@/lib/auth";
import { getAlertCount } from "@/lib/alerts";
import { getFeatures } from "@/lib/features";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const features = getFeatures();

  // Con el modulo de gasto apagado no hay alarmas que contar: evita la query
  // en cada navegacion del MVP.
  const alertCount = features.spend ? await getAlertCount() : 0;

  return (
    <AppShell user={user} alertCount={alertCount} features={features}>
      {children}
    </AppShell>
  );
}
