/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleNameMapper: {
    '^@war-rooms/backend-interface(.*)$': '<rootDir>/packages/backend-interface/src$1',
    '^@war-rooms/backend-mock(.*)$': '<rootDir>/packages/backend-mock/src$1',
    '^@war-rooms/backend-openfire(.*)$': '<rootDir>/packages/backend-openfire/src$1',
    '^@war-rooms/state(.*)$': '<rootDir>/packages/state/src$1',
    '^@war-rooms/chat-ui(.*)$': '<rootDir>/packages/chat-ui/src$1',
    '^@war-rooms/admin-ui(.*)$': '<rootDir>/packages/admin-ui/src$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/*.stories.tsx',
    '!packages/*/src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  verbose: true,
};
