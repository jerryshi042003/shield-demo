/**
 * Closed contract for Shield product-activity telemetry.
 *
 * The client emitter may only send the bounded fields defined here. The server
 * derives the actor and franchise from trusted Easy Auth headers, never from the
 * request body, and validates every client field against this allowlist. No
 * email, raw prompt/answer, SQL, token, PII, or arbitrary property is accepted.
 */

export const ACTIVITY_EVENT_TYPES = ['page_view', 'report_nav'] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export const ACTIVITY_SURFACES = [
  'overview',
  'sales_season',
  'sales_game',
  'sales_analysis',
  'sales_spom',
  'sales_payments',
  'sales_daily_sales',
  'sales_renewals',
  'sales_commissions',
  'sales',
  'marketing',
  'select_franchise',
  'other'
] as const;
export type ActivitySurface = (typeof ACTIVITY_SURFACES)[number];

// Report identifiers used by the shared report-navigation manifest.
export const ACTIVITY_REPORTS = [
  'ticket-sales',
  'games',
  'payments',
  'daily-sales',
  'sales-analysis',
  'season-summary',
  'spom',
  'renewals',
  'sales'
] as const;
export type ActivityReport = (typeof ACTIVITY_REPORTS)[number];

export const ACTIVITY_ACTIONS = ['view', 'open_report'] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_OUTCOMES = ['success', 'error'] as const;
export type ActivityOutcome = (typeof ACTIVITY_OUTCOMES)[number];

const MAX_LATENCY_MS = 600_000;
const CORRELATION_PATTERN = /^[A-Za-z0-9-]{8,64}$/u;

// Keys that must never appear in an activity payload. Their presence is a
// contract violation and the request is rejected rather than silently trimmed.
const FORBIDDEN_KEYS = new Set([
  'email',
  'mail',
  'upn',
  'name',
  'actor',
  'actorid',
  'actor_id',
  'viewer',
  'viewerid',
  'user',
  'userid',
  'prompt',
  'question',
  'answer',
  'response',
  'sql',
  'query',
  'querytext',
  'token',
  'password',
  'secret',
  'properties',
  'customproperties',
  'customdimensions',
  'metadata',
  'payload'
]);

/**
 * The safe, server-owned record derived from a validated client event plus the
 * trusted actor context. This is the only shape that is logged or forwarded.
 */
export type ActivityRecord = {
  eventType: ActivityEventType;
  surface: ActivitySurface;
  report: ActivityReport | null;
  action: ActivityAction;
  outcome: ActivityOutcome;
  latencyMs: number | null;
  correlationId: string | null;
  // Reserved for the future Genie correlation contract (HOLD): never populated
  // by the current client and always null until Genie is released.
  conversationId: string | null;
  messageId: string | null;
  queryId: string | null;
};

export type NormalizedActivity =
  | { ok: true; event: ClientActivityEvent }
  | { ok: false; reason: string };

// Only these fields are ever read from the request body.
export type ClientActivityEvent = {
  eventType: ActivityEventType;
  surface: ActivitySurface;
  report: ActivityReport | null;
  action: ActivityAction;
  outcome: ActivityOutcome;
  latencyMs: number | null;
  correlationId: string | null;
  conversationId: string | null;
  messageId: string | null;
  queryId: string | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalCorrelation(
  value: unknown,
  field: string
): { ok: true; value: string | null } | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== 'string' || !CORRELATION_PATTERN.test(value)) {
    return { ok: false, reason: `invalid_${field}` };
  }
  return { ok: true, value };
}

/**
 * Validates a raw request body against the closed contract. Rejects unknown or
 * forbidden keys, unknown enum values, and malformed identifiers. Identity and
 * franchise are intentionally NOT read here; the server supplies them.
 */
export function normalizeActivityEvent(body: unknown): NormalizedActivity {
  if (!isPlainObject(body)) return { ok: false, reason: 'invalid_body' };

  for (const key of Object.keys(body)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lower)) {
      return { ok: false, reason: 'forbidden_field' };
    }
  }

  const eventType = body.eventType;
  if (!ACTIVITY_EVENT_TYPES.includes(eventType as ActivityEventType)) {
    return { ok: false, reason: 'invalid_event_type' };
  }

  const surface = body.surface;
  if (!ACTIVITY_SURFACES.includes(surface as ActivitySurface)) {
    return { ok: false, reason: 'invalid_surface' };
  }

  let report: ActivityReport | null = null;
  if (body.report !== undefined && body.report !== null) {
    if (!ACTIVITY_REPORTS.includes(body.report as ActivityReport)) {
      return { ok: false, reason: 'invalid_report' };
    }
    report = body.report as ActivityReport;
  }

  const action = body.action ?? 'view';
  if (!ACTIVITY_ACTIONS.includes(action as ActivityAction)) {
    return { ok: false, reason: 'invalid_action' };
  }

  const outcome = body.outcome ?? 'success';
  if (!ACTIVITY_OUTCOMES.includes(outcome as ActivityOutcome)) {
    return { ok: false, reason: 'invalid_outcome' };
  }

  let latencyMs: number | null = null;
  if (body.latencyMs !== undefined && body.latencyMs !== null) {
    const value = body.latencyMs;
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > MAX_LATENCY_MS
    ) {
      return { ok: false, reason: 'invalid_latency' };
    }
    latencyMs = Math.round(value);
  }

  const correlation = optionalCorrelation(body.correlationId, 'correlation');
  if (!correlation.ok) return correlation;
  const conversation = optionalCorrelation(body.conversationId, 'conversation');
  if (!conversation.ok) return conversation;
  const message = optionalCorrelation(body.messageId, 'message');
  if (!message.ok) return message;
  const queryCorrelation = optionalCorrelation(body.queryId, 'query');
  if (!queryCorrelation.ok) return queryCorrelation;

  return {
    ok: true,
    event: {
      eventType: eventType as ActivityEventType,
      surface: surface as ActivitySurface,
      report,
      action: action as ActivityAction,
      outcome: outcome as ActivityOutcome,
      latencyMs,
      correlationId: correlation.value,
      conversationId: conversation.value,
      messageId: message.value,
      queryId: queryCorrelation.value
    }
  };
}

/** Maps a pathname to a bounded, allowlisted surface label. */
export function surfaceForRoute(pathname: string): ActivitySurface {
  if (pathname === '/overview') return 'overview';
  if (pathname.startsWith('/sales/spom')) return 'sales_spom';
  if (pathname.startsWith('/sales/payments')) return 'sales_payments';
  if (pathname.startsWith('/sales/daily-sales')) return 'sales_daily_sales';
  if (pathname.startsWith('/sales/renewals')) return 'sales_renewals';
  if (pathname.startsWith('/sales/commissions')) return 'sales_commissions';
  if (pathname.startsWith('/sales/ticket-sales')) return 'sales_season';
  if (pathname.startsWith('/sales/season')) return 'sales_season';
  if (pathname.startsWith('/sales/game')) return 'sales_game';
  if (pathname.startsWith('/sales/analysis')) return 'sales_analysis';
  if (pathname.startsWith('/sales')) return 'sales';
  if (pathname.startsWith('/marketing')) return 'marketing';
  if (pathname.startsWith('/select-franchise')) return 'select_franchise';
  return 'other';
}
