/**
 * Small id helpers. We avoid relying on crypto.randomUUID (not always present
 * in the RN runtime) and use a timestamp + random suffix which is unique enough
 * for a single device's local records.
 */
export function newId(prefix?: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  const id = `${time}${rand}`;
  return prefix ? `${prefix}_${id}` : id;
}

/** Stable per-install device id. Generated once and stored in the DB. */
export function newDeviceId(): string {
  return newId('device');
}
