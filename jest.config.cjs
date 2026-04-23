module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  moduleNameMapper: {
    // This helps Jest find your lib and component paths if you use aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};