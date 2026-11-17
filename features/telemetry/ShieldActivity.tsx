'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { emitActivity } from '@/lib/telemetry/emit';
import { surfaceForRoute } from '@/lib/telemetry/activity-contract';

/**
 * Emits a bounded page-view activity event whenever the route changes. It sends
 * no identity — the server derives the actor from trusted Easy Auth headers.
 * A client-side guard avoids re-emitting the same surface on re-render; the
 * server also dedupes per actor as defense in depth.
 */
export function ShieldActivity() {
  const pathname = usePathname();
  const lastSurfaceRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    const surface = surfaceForRoute(pathname);
    if (lastSurfaceRef.current === surface) return;
    lastSurfaceRef.current = surface;

    const latencyMs = Math.max(0, Date.now() - startedAtRef.current);
    startedAtRef.current = Date.now();

    emitActivity({
      eventType: 'page_view',
      surface,
      outcome: 'success',
      latencyMs
    });
  }, [pathname]);

  return null;
}
