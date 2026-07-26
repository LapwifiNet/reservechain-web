module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  // The e2e suites share one Postgres database, and the audit chain is a
  // global singleton verified across the whole table — parallel workers
  // corrupt each other's view by construction (a concurrent record() forks
  // the chain; the audit suite's deleteMany strands in-flight writers on a
  // deleted tail). Serial execution scopes the database to one suite at a
  // time. Do not "fix" a cross-suite race with a sleep or a retry.
  maxWorkers: 1,
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testTimeout: 30000,
};
