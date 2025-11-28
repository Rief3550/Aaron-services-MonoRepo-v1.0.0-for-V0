/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@aaron/common$': '<rootDir>/../../libs/common/src',
    '^@aaron/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@aaron/auth$': '<rootDir>/../../libs/auth/src',
    '^@aaron/auth/(.*)$': '<rootDir>/../../libs/auth/src/$1',
    '^@aaron/mail$': '<rootDir>/../../libs/mail/src',
    '^@aaron/mail/(.*)$': '<rootDir>/../../libs/mail/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};

