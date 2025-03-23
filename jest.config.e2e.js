module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/test/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?': 'ts-jest',
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['./test/setup.ts'],
};