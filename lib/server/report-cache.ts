import 'server-only';

export type ReportCacheState = 'fresh' | 'refreshing';

type Entry<T> = {
  value: T;
  refreshedAt: number;
  refreshAfter: number;
  hardExpiresAt: number;
};

type Policy = {
  softTtlMs: number;
  hardExpiresAt: number;
  forceRefresh?: boolean;
};

/**
 * Small per-process stale-while-revalidate cache for aggregate reports.
 *
 * A soft expiry starts a background refresh while the last verified value is
 * still valid. A hard expiry blocks until a current value is verified. Never
 * use this for person-scoped data when revocation must invalidate immediately.
 */
export class ReportCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly flights = new Map<string, Promise<Entry<T>>>();

  constructor(
    private readonly maxEntries = 32,
    private readonly now: () => number = Date.now
  ) {}

  /** Seeds a previously verified aggregate so a new process can serve it immediately. */
  prime(
    key: string,
    value: T,
    entry: {
      refreshedAt: number;
      refreshAfter: number;
      hardExpiresAt: number;
    }
  ): boolean {
    const now = this.now();
    if (
      !Number.isFinite(entry.refreshedAt) ||
      !Number.isFinite(entry.refreshAfter) ||
      !Number.isFinite(entry.hardExpiresAt) ||
      entry.refreshedAt > now ||
      entry.refreshAfter < entry.refreshedAt ||
      entry.hardExpiresAt <= now ||
      entry.refreshAfter > entry.hardExpiresAt
    )
      return false;
    const current = this.entries.get(key);
    if (current && current.refreshedAt >= entry.refreshedAt) return false;
    this.entries.set(key, { value, ...entry });
    this.trim();
    return true;
  }

  async load(
    key: string,
    loader: () => Promise<T>,
    policy: Policy
  ): Promise<{
    value: T;
    state: ReportCacheState;
    refreshedAt: number;
    refreshAfter: number;
    hardExpiresAt: number;
  }> {
    const now = this.now();
    const cached = this.entries.get(key);
    if (
      !policy.forceRefresh &&
      cached &&
      now < Math.min(cached.hardExpiresAt, policy.hardExpiresAt)
    ) {
      if (now < cached.refreshAfter)
        return { ...cached, state: 'fresh' as const };
      void this.refresh(key, loader, policy).catch(() => undefined);
      return { ...cached, state: 'refreshing' as const };
    }
    const entry = await this.refresh(key, loader, policy);
    return { ...entry, state: 'fresh' as const };
  }

  private refresh(key: string, loader: () => Promise<T>, policy: Policy) {
    const running = this.flights.get(key);
    if (running) return running;
    const flight = loader()
      .then((value) => {
        const refreshedAt = this.now();
        const entry = {
          value,
          refreshedAt,
          refreshAfter: Math.min(
            refreshedAt + policy.softTtlMs,
            policy.hardExpiresAt
          ),
          hardExpiresAt: policy.hardExpiresAt
        };
        this.entries.set(key, entry);
        this.trim();
        return entry;
      })
      .finally(() => this.flights.delete(key));
    this.flights.set(key, flight);
    return flight;
  }

  private trim() {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (now >= entry.hardExpiresAt) this.entries.delete(key);
    }
    while (this.entries.size > this.maxEntries) {
      const oldest = [...this.entries.entries()].reduce((a, b) =>
        a[1].refreshedAt <= b[1].refreshedAt ? a : b
      );
      this.entries.delete(oldest[0]);
    }
  }
}
