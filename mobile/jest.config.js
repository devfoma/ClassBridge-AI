/**
 * Lightweight jest config for the mobile package. We only unit-test pure
 * TypeScript modules (no React Native / Expo runtime), so we can use a plain
 * ts-jest + node environment without the heavy jest-expo preset.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
};
