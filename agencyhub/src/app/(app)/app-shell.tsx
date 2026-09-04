"use client";

import { Sidebar } from "@/components/layout/sidebar";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function AppShell({
  user,
  alertCount = 0,
  features = { spend: false },
  children,
}: {
  user: AppUser;
  alertCount?: number;
  features?: { spend: boolean };
  children: React.ReactNode;
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="ah-app">
      <Sidebar
        userName={user.name}
        userInitials={initials}
        userRole={user.role}
        alertCount={alertCount}
        features={features}
      />
      <main className="ah-main">{children}</main>
    </div>
  );
}
