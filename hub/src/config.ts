import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  hubName: 'ClassBridge Local Hub',
  version: '0.1.0',

  dbPath: process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), 'data', 'classbridge.sqlite'),

  gemma: {
    provider: (process.env.GEMMA_PROVIDER || 'ollama') as 'ollama' | 'mock',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
    model: process.env.OLLAMA_MODEL || 'gemma4',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
    allowMockFallback: bool(process.env.GEMMA_ALLOW_MOCK_FALLBACK, true),
  },

  isTest: process.env.NODE_ENV === 'test',
};

export type AppConfig = typeof config;
