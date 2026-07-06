// Force deterministic, offline-friendly behaviour for the test suite.
process.env.NODE_ENV = 'test';
process.env.GEMMA_PROVIDER = 'mock';
process.env.GEMMA_ALLOW_MOCK_FALLBACK = 'true';
