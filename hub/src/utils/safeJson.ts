export interface SafeJsonResult<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: string;
}

/**
 * Best-effort JSON parser for (possibly messy) LLM output.
 * 1. Try a direct JSON.parse.
 * 2. Strip common markdown code fences (```json ... ```), then retry.
 * 3. Extract the first balanced JSON object/array substring and parse that.
 * Never throws.
 */
export function safeJsonParse<T = unknown>(input: string): SafeJsonResult<T> {
  if (input == null || typeof input !== 'string' || input.trim() === '') {
    return { ok: false, data: null, error: 'Empty input' };
  }

  const direct = tryParse<T>(input);
  if (direct.ok) return direct;

  const defenced = stripCodeFences(input);
  if (defenced !== input) {
    const parsed = tryParse<T>(defenced);
    if (parsed.ok) return parsed;
  }

  const extracted = extractFirstJson(defenced);
  if (extracted != null) {
    const parsed = tryParse<T>(extracted);
    if (parsed.ok) return parsed;
  }

  return { ok: false, data: null, error: 'Could not parse or repair JSON' };
}

function tryParse<T>(text: string): SafeJsonResult<T> {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (err) {
    return { ok: false, data: null, error: (err as Error).message };
  }
}

function stripCodeFences(text: string): string {
  let t = text.trim();
  // ```json\n...\n``` or ```\n...\n```
  const fence = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/m;
  const m = t.match(fence);
  if (m && m[1]) t = m[1].trim();
  return t;
}

/**
 * Scan for the first balanced {...} or [...] block, respecting strings/escapes.
 */
function extractFirstJson(text: string): string | null {
  const start = firstIndexOfAny(text, ['{', '[']);
  if (start === -1) return null;

  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function firstIndexOfAny(text: string, chars: string[]): number {
  let min = -1;
  for (const c of chars) {
    const idx = text.indexOf(c);
    if (idx !== -1 && (min === -1 || idx < min)) min = idx;
  }
  return min;
}
