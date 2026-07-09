import { config } from '../config';
import { GemmaResult, GemmaUnavailableError } from '../types/gemma';
import { mockGemma } from './gemmaMock.service';

/**
 * Build the final Ollama generate URL from the configured base URL.
 * If the base already ends with /api we append /generate, otherwise we
 * normalise to <base>/api/generate. Default => http://localhost:11434/api/generate
 */
export function buildOllamaUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/generate')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/generate`;
  return `${trimmed}/api/generate`;
}

async function callOllama(prompt: string): Promise<string> {
  const url = buildOllamaUrl(config.gemma.ollamaBaseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.gemma.timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.gemma.model,
        prompt,
        stream: false,
        // Every prompt in this app asks for a JSON object back. Ollama's grammar-
        // constrained "format: json" decoding is the biggest lever against
        // malformed output — without it small local models routinely add prose,
        // single-quote keys, or otherwise drift from valid JSON.
        format: 'json',
        options: {
          // Low temperature: we want faithful structured output, not creative
          // variation, and creative drift is a common cause of broken JSON.
          temperature: 0.2,
          // Generous output budget so longer quizzes/summaries aren't cut off
          // mid-object, which produces JSON that can't be repaired (unbalanced
          // braces) rather than just messy.
          num_predict: 2048,
        },
        // Keep the model resident for 30 min so subsequent requests skip the
        // cold-load cost (a big cause of sporadic timeouts on CPU-only setups).
        keep_alive: '30m',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new GemmaUnavailableError(
        `Ollama responded ${res.status} ${res.statusText}. ${body.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as { response?: string };
    if (typeof data.response !== 'string') {
      throw new GemmaUnavailableError('Ollama response missing "response" field.');
    }
    return data.response;
  } catch (err) {
    if (err instanceof GemmaUnavailableError) throw err;
    const name = (err as Error).name;
    if (name === 'AbortError') {
      throw new GemmaUnavailableError(
        `Gemma request timed out after ${config.gemma.timeoutMs}ms. Is the model loaded in Ollama?`
      );
    }
    throw new GemmaUnavailableError(
      `Could not reach Ollama at ${config.gemma.ollamaBaseUrl}. Is Ollama running? (${(err as Error).message})`
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask Gemma. Returns the raw model text plus metadata about which provider
 * actually served the request. Never throws raw Ollama errors: on failure it
 * either falls back to the mock (if allowed) or raises GemmaUnavailableError,
 * which the routes translate into a friendly 503.
 */
export async function askGemma(prompt: string): Promise<GemmaResult> {
  if (config.gemma.provider === 'mock') {
    return { raw: mockGemma(prompt), provider: 'mock', usedMockFallback: false };
  }

  try {
    const raw = await callOllama(prompt);
    return { raw, provider: 'ollama', usedMockFallback: false };
  } catch (err) {
    if (config.gemma.allowMockFallback) {
      // eslint-disable-next-line no-console
      console.warn(
        `[gemma] Ollama unavailable, using mock fallback: ${(err as Error).message}`
      );
      return { raw: mockGemma(prompt), provider: 'mock', usedMockFallback: true };
    }
    throw err;
  }
}

/** Lightweight probe used by /health and settings screens. */
export async function gemmaStatus(): Promise<{
  provider: string;
  model: string;
  reachable: boolean;
  detail: string;
}> {
  if (config.gemma.provider === 'mock') {
    return { provider: 'mock', model: 'mock', reachable: true, detail: 'Deterministic mock provider active.' };
  }
  try {
    await callOllama('Return the single word: ok');
    return {
      provider: 'ollama',
      model: config.gemma.model,
      reachable: true,
      detail: `Ollama reachable with model "${config.gemma.model}".`,
    };
  } catch (err) {
    return {
      provider: 'ollama',
      model: config.gemma.model,
      reachable: false,
      detail: (err as Error).message,
    };
  }
}
