// Run only against the explicitly provisioned disposable CI database.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createPrismaClient } = require('../dist/database.js');
const prisma = createPrismaClient();
const username = `adapter-smoke-${randomUUID()}`;
(async () => {
  try {
    const created = await prisma.user.create({ data: { username, password: 'synthetic-ci-only' } });
    assert.equal((await prisma.user.findUnique({ where: { id: created.id } })).username, username);
    assert.equal((await prisma.user.update({ where: { id: created.id }, data: { fullName: 'Adapter smoke' } })).fullName, 'Adapter smoke');
    await prisma.user.delete({ where: { id: created.id } });
    assert.equal(await prisma.user.findUnique({ where: { id: created.id } }), null);
    console.log('MySQL adapter create/read/update/delete passed.');
  } finally {
    await prisma.user.deleteMany({ where: { username } }).catch(() => {});
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
