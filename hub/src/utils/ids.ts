import { randomUUID } from 'crypto';

export function newId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id.slice(0, 8)}` : id;
}

/**
 * Generate a human-friendly class code like "JSS2-4821".
 * Base is derived from the classroom name; suffix is 4 random digits.
 */
export function generateClassCode(name: string): string {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'CLAS';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}
