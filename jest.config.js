/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(jotai)/)'],
  moduleNameMapper: {
    '^@war-rooms/(.*)$': '<rootDir>/packages/$1/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'packages/**/*.{ts,tsx}',
    '!packages/**/*.d.ts',
    '!packages/**/*.stories.tsx',
    '!packages/**/node_modules/**',
    '!packages/**/dist/**',
    '!packages/chat-ui/**', // Exclude chat-ui (uses Vite/import.meta)
    '!**/.storybook/**', // Exclude storybook config
  ],
  // Coverage thresholds - start low and increase as tests are added
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
