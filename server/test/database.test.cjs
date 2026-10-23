const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createPrismaClient } = require('../dist/database.js');

test('rejects missing, invalid and wrong-provider URLs without echoing credentials', () => {
  for (const url of ['', 'not a URL', 'postgresql://secret:password@example.test/db']) {
    assert.throws(() => createPrismaClient(url), /^Error: DATABASE_URL must be a MySQL/);
  }
});
test('rejects legacy TLS settings instead of silently ignoring them', () => {
  for (const key of ['sslaccept', 'sslcert', 'sslidentity']) {
    assert.throws(() => createPrismaClient(`mysql://user:pass@localhost/db?${key}=value`), /MariaDB driver TLS options/);
  }
});
test('constructs the supported adapter without making a database connection', async () => {
  const client = createPrismaClient('mysql://user:p%40ss@localhost:3306/db?connectionLimit=2');
  await client.$disconnect();
});
