/**
 * Defensive JSON helpers used when reading columns/AI output on the device.
 * Never throw - always return the fallback on malformed input (mirrors the
 * hub's safeJson so bad data never crashes the app).
 */
export function safeParse<T>(input: string | null | undefined, fallback: T): T {
  if (input == null || input === '') return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return 'null';
  }
}
