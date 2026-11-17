'use client';

import { TopBar } from './top-bar';
import { COLORS } from '@/lib/design-tokens';
import type { AuthUser } from '@/lib/types/auth-user';
import { ShieldActivity } from '@/features/telemetry/ShieldActivity';

export function DashboardContent({
  children,
  user
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  return (
    <>
      <ShieldActivity />
      <TopBar user={user} />
      <main
        className="flex-1 p-4 md:p-6"
        style={{
          backgroundColor: COLORS.primary,
        }}
      >
        {children}
      </main>
    </>
  );
}
