// Pure domain/architecture checks: no browser, database or runtime activation.
export default {
  resolve: {alias: {'@': process.cwd() + '/src'}},
  test: {
    environment: 'node', maxWorkers: 1, pool: 'threads',
    include: [
      'tests/unit/cafef-raw-close.test.ts',
      'tests/architecture/cafef-raw-close.test.mjs',
      'tests/unit/market-boundary.test.ts',
      'tests/architecture/market-boundary.test.mjs',
    ],
  },
};
