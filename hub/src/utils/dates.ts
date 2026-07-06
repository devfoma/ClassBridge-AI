export function nowIso(): string {
  return new Date().toISOString();
}

export function isAfter(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a) return false;
  if (!b) return true;
  return new Date(a).getTime() > new Date(b).getTime();
}
