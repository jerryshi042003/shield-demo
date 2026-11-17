/**
 * Parse NDJSON (Newline Delimited JSON) or regular JSON data
 *
 * Handles both formats:
 * - Single JSON object or array: `{ ... }` or `[...]`
 * - NDJSON format: Multiple JSON objects separated by newlines
 *
 * @param rawText - Raw text response from blob storage
 * @returns Array of parsed JSON objects
 */
export function parseNDJSON<T = Record<string, unknown>>(rawText: string): T[] {
  try {
    // Try parsing as single JSON first
    const singleJson: unknown = JSON.parse(rawText);
    return Array.isArray(singleJson) ? singleJson as T[] : [singleJson as T];
  } catch {
    // If that fails, try NDJSON format (newline-delimited JSON)
    const jsonLines = rawText.trim().split('\n').filter(line => line.trim());
    return jsonLines.map(line => JSON.parse(line) as T);
  }
}
