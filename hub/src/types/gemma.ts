export type GemmaProvider = 'ollama' | 'mock';

export interface GemmaResult {
  raw: string;
  provider: GemmaProvider;
  usedMockFallback: boolean;
}

export class GemmaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GemmaUnavailableError';
  }
}
