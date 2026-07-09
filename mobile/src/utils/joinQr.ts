/**
 * Shared shape for the "join the hub" QR code. The teacher screen encodes this
 * payload into a QR; the student scanner decodes it. Keeping both sides on this
 * single helper means the format can never drift between them.
 */
export interface JoinPayload {
  hubUrl: string;
  classCode: string;
}

/** Encode the QR payload a teacher displays so a student can scan to join. */
export function encodeJoinPayload(hubUrl: string, classCode: string): string {
  return JSON.stringify({ hubUrl: hubUrl ?? '', classCode });
}

/**
 * Parse a scanned QR value into a join payload. Tolerates:
 *   - the JSON payload we emit: { hubUrl, classCode }
 *   - a bare class-code string (e.g. a hand-made QR of just the code)
 * Returns null for anything that isn't plausibly a ClassBridge join code, so
 * random QR codes in the camera view are ignored rather than half-joined.
 */
export function parseJoinPayload(raw: string): JoinPayload | null {
  const value = raw?.trim();
  if (!value) return null;

  try {
    const obj = JSON.parse(value) as Partial<JoinPayload>;
    const classCode = typeof obj.classCode === 'string' ? obj.classCode.trim() : '';
    if (!classCode) return null;
    return { hubUrl: typeof obj.hubUrl === 'string' ? obj.hubUrl.trim() : '', classCode };
  } catch {
    // Not JSON: only accept it if it looks like a bare class code (e.g. JSS2-4821).
    return /^[A-Z0-9][A-Z0-9-]{3,15}$/i.test(value) ? { hubUrl: '', classCode: value } : null;
  }
}
