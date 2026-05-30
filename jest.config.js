module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/services'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['services/*/src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
