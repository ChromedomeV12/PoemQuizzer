// Synthetic CI fixture only: verifies username-only registration/login after generation.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const net = require('node:net');
const { once } = require('node:events');
const { createPrismaClient } = require('../dist/database.js');
const prisma = createPrismaClient();
const username = `ci_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
let child;
(async () => {
  try {
    const listener = net.createServer().listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    child = spawn(process.execPath, [require.resolve('../dist/index.js')], {
      env: { ...process.env, PORT: String(port), JWT_SECRET: 'synthetic-ci-jwt-secret-not-used-in-production' },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('error', error => { console.error(error); });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error('API exited before readiness.');
      try { ready = (await fetch(`${base}/api/health`)).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'API starts with the generated MySQL client');
    const post = (path, data) => fetch(`${base}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    assert.equal((await post('/api/auth/register', { username, password: 'fixture-password123' })).status, 201);
    assert.equal((await post('/api/auth/login', { identifier: username, password: 'wrong-password' })).status, 401);
    const login = await post('/api/auth/login', { identifier: username, password: 'fixture-password123' });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    assert.equal(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).email, 'no-email');
    assert.equal((await fetch(`${base}/api/auth/me`)).status, 401);
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
    console.log('Username-only registration/login and authenticated profile passed.');
  } finally {
    if (child && child.exitCode === null) child.kill();
    await prisma.user.deleteMany({ where: { username } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
