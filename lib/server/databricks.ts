/**
 * Public demo: the production Databricks SQL / Genie client was removed. Only
 * the shared fail-closed error type remains so report routes keep their
 * contract. No code in this demo opens a network connection to a warehouse.
 */
export class ReportUnavailable extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'ReportUnavailable';
  }
}
