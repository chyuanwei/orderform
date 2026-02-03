/** Jest 設定：GAS 專案單元測試 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/gas'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: [],
  collectCoverageFrom: [
    'gas/**/*.js',
    '!gas/__tests__/**',
    '!gas/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
