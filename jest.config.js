module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/services'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'services/*/src/**/*.js',
    '!services/*/src/tracing.js',
    '!services/*/src/db.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60,
    },
  },
};
