import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const invalidConfig = process.argv.includes('--invalid-config');
const canary = 'vn30-invalid-config-secret-canary';
const mode = process.argv.includes('--dev') ? 'dev' : 'start';
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', mode, '--hostname', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'], detached: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', LOG_LEVEL: invalidConfig ? canary : 'info' },
});
let output = '';
let leakedCanary = false;
let launchError;
child.on('error', error => { launchError = error; });
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { const combined = output + chunk;
  if (combined.includes(canary)) leakedCanary = true;
  output = combined.slice(-8000); });
const exited = once(child, 'exit');
let browserGroup;
function stopBrowser() {
  if (!browserGroup) return;
  try { process.kill(-browserGroup, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  browserGroup = undefined;
}
async function cleanup() {
  stopBrowser();
  try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  await Promise.race([exited, delay(3000)]);
  try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  if (stopping) return;
  stopping = true;
  await cleanup();
  process.exit(1);
});
try {
  if (invalidConfig) {
    const failureDeadline = Date.now() + 15000;
    while (!output.includes('CONFIGURATION_ERROR') && Date.now() < failureDeadline) {
      if (launchError) throw launchError;
      if (child.exitCode !== null || child.signalCode !== null) break;
      await delay(100);
    }
    if (!output.includes('CONFIGURATION_ERROR') || output.includes('application.started')) {
      throw new Error('Invalid configuration was not rejected by the startup hook');
    }
    let healthy = false;
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2000) });
      healthy = response.ok;
      if ((await response.text()).includes(canary)) leakedCanary = true;
    } catch { /* Next may reject readiness without closing the listening socket. */ }
    if (healthy) throw new Error('Invalid configuration served a healthy response');
    if (leakedCanary) throw new Error('Configuration value leaked into output');
    console.log(`PASS ${mode}: invalid config blocks readiness/HTTP success; no canary leakage`);
  } else {
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Application exited before readiness');
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2000) });
      if (response.ok && (await response.text()).includes('VN30 Value Investing OS')) { ready = true; break; }
    } catch { /* Retry only until bounded readiness deadline. */ }
    await delay(200);
  }
  if (!ready) throw new Error('Application readiness timed out');
  // HTTP success alone could be another process. Check owner and exact binding.
  const listeners = execFileSync('/usr/sbin/lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpn'], { encoding: 'utf8' });
  const rows = listeners.trim().split('\n');
  const owners = rows.filter(row => row.startsWith('p')).map(row => row.slice(1));
  const addresses = rows.filter(row => row.startsWith('n')).map(row => row.slice(1));
  if (!owners.length || !addresses.length || addresses.some(address => address !== `127.0.0.1:${port}`)) {
    throw new Error('Expected an exclusively loopback listener');
  }
  for (const owner of owners) {
    const group = execFileSync('/bin/ps', ['-o', 'pgid=', '-p', owner], { encoding: 'utf8' }).trim();
    if (group !== String(child.pid)) throw new Error('Listener is not owned by the smoke process group');
  }
  if (!output.includes('application.started')) throw new Error('Startup logging hook did not run');
  console.log(`PASS ${mode}: HTTP 200, product heading, startup hook, owned loopback listener on port ${port}`);
  if (process.argv.includes('--e2e')) {
    const browser = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
      stdio: 'inherit', detached: true, env: { ...process.env, VN30_E2E_BASE_URL: `http://127.0.0.1:${port}` },
    });
    browserGroup = browser.pid;
    const timer = setTimeout(stopBrowser, 90000);
    try {
      const [code] = await once(browser, 'exit');
      if (code !== 0) throw new Error('Browser smoke failed');
    } finally { clearTimeout(timer); stopBrowser(); }
  }

  }
} catch (error) {
  console.error(error.message);
  // Never dump inherited environment, raw error output or server diagnostics.
  console.error(`Captured ${output.length} characters of server diagnostics (not printed).`);
  process.exitCode = 1;
} finally {
  await cleanup();
}
