import type {
  ActivityAction,
  ActivityOutcome,
  ActivityReport,
  ActivitySurface
} from '@/lib/telemetry/activity-contract';

const ENDPOINT = '/api/telemetry/activity';
const DEMO_TELEMETRY_DISABLED = true;

type EmitInput = {
  eventType: 'page_view' | 'report_nav';
  surface: ActivitySurface;
  // The report id is sent as-is; the server validates it against the allowlist.
  report?: ActivityReport | string;
  action?: ActivityAction;
  outcome?: ActivityOutcome;
  latencyMs?: number;
};

let correlationId: string | null = null;

// A per-session correlation id. It is a random opaque token, not identity, used
// to order one visitor's actions (and, in future, their Genie messages). The
// server never trusts the client for identity.
function getCorrelationId(): string | null {
  if (correlationId) return correlationId;
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem('shield-correlation');
    if (stored) {
      correlationId = stored;
      return correlationId;
    }
  } catch {
    // sessionStorage may be unavailable; fall through to an in-memory id.
  }
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  correlationId = generated;
  try {
    window.sessionStorage.setItem('shield-correlation', generated);
  } catch {
    // Non-fatal: keep the in-memory id for this page.
  }
  return correlationId;
}

/** Fire-and-forget emit. Never throws and never blocks navigation. */
export function emitActivity(input: EmitInput): void {
  if (typeof window === 'undefined') return;
  // Public demo: product telemetry is disabled; nothing leaves the browser.
  if (DEMO_TELEMETRY_DISABLED) return;

  const body = JSON.stringify({
    eventType: input.eventType,
    surface: input.surface,
    report: input.report,
    action: input.action ?? (input.eventType === 'report_nav' ? 'open_report' : 'view'),
    outcome: input.outcome ?? 'success',
    latencyMs: input.latencyMs,
    correlationId: getCorrelationId() ?? undefined
  });

  try {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    // Fall through to fetch.
  }

  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store'
    }).catch(() => undefined);
  } catch {
    // Telemetry must never affect the user experience.
  }
}

export function emitReportNav(surface: ActivitySurface, report: string): void {
  emitActivity({
    eventType: 'report_nav',
    surface,
    report,
    action: 'open_report'
  });
}
