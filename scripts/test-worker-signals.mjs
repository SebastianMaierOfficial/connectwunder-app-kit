/** Abort an actual workerd HTTP qualification with real OS signals and verify owned cleanup. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((out, value, index, all) => index % 2 === 0 ? [...out, [value, all[index + 1]]] : out, []));
if (!args['--binary'] || !args['--scratch'] || !args['--evidence']) throw Error('Required: --binary --scratch --evidence');
const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = path.resolve(args['--scratch']), evidence = path.resolve(args['--evidence']);
await mkdir(scratch); await mkdir(evidence, { recursive: true });
const children = new Set(), ownedRuntimes = new Set(); let interrupted = false;
const interrupt = () => { interrupted = true; for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); };
process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function bounded(promise, milliseconds) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('signal_cleanup_timeout')), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
function connectable(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = createConnection({ port, host });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => finish(true)); socket.once('error', () => finish(false)); socket.setTimeout(300, () => finish(false));
  });
}
const results = [];
try {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    if (interrupted) throw Error('signal_test_canceled');
    const name = signal.toLowerCase(), target = path.join(evidence, name);
    await mkdir(target);
    const child = spawn(process.execPath, [path.join(root, 'tests/fixtures/native-signal-child.mjs'), path.resolve(args['--binary']), path.join(scratch, name), target], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    children.add(child); let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data.toString(); }); child.stderr.on('data', data => { if (stderr.length < 16384) stderr += data.toString().slice(0, 16384 - stderr.length); });
    const exited = new Promise(resolve => child.once('exit', (code, exitSignal) => resolve({ code, signal: exitSignal })));
    let lifecycle;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && child.exitCode === null && child.signalCode === null && !interrupted) {
      try { lifecycle = JSON.parse(await readFile(path.join(target, 'native-lifecycle.json'), 'utf8')); if (lifecycle.phase === 'native_http_probe_pending') break; } catch {}
      await pause(30);
    }
    assert.equal(lifecycle?.phase, 'native_http_probe_pending', 'Must interrupt actual in-flight native HTTP, not startup or a mock');
    ownedRuntimes.add(lifecycle.runtimePid);
    const listeningBefore = await Promise.all(lifecycle.ports.map(port => connectable(port)));
    assert.ok(listeningBefore.every(Boolean));
    process.kill(lifecycle.runtimePid, 0);
    child.kill(signal);
    const outcome = await bounded(exited, 12000);
    assert.notEqual(outcome.code, 0);
    assert.equal(outcome.signal, null, 'Qualifier must handle the signal and finish its own cleanup');
    const receipt = JSON.parse(await readFile(path.join(target, 'native-network.json'), 'utf8'));
    assert.equal(receipt.status, 'canceled'); assert.equal(receipt.canceledBy, signal);
    assert.equal(receipt.cleanup.runtimeExited, true); assert.equal(receipt.cleanup.serverListenersClosed, true);
    assert.ok(receipt.nativeHttpCounters.providerRequests >= 1);
    assert.match(stdout, /"status":"canceled"/u); assert.doesNotMatch(stdout, /"status":"pass"/u);
    const remainingListeners = await Promise.all(lifecycle.ports.flatMap(port => ['127.0.0.1', '::1'].map(host => connectable(port, host))));
    assert.ok(remainingListeners.every(value => value === false));
    assert.throws(() => process.kill(lifecycle.runtimePid, 0), error => error.code === 'ESRCH');
    ownedRuntimes.delete(lifecycle.runtimePid);
    results.push({ signal, qualifierExitCode: outcome.code, realNativeHttpWasInFlight: true, cancellationReceipt: true, runtimeGone: true, allOwnLoopbackPortsClosed: true, falsePassRecorded: false });
    await writeFile(path.join(target, 'child-stderr.log'), stderr);
    children.delete(child);
  }
  if (interrupted) throw Error('signal_test_canceled');
  const report = { status: 'pass', actualRuntimeAndOsSignals: true, mockedRuntimeOrFetch: false, results };
  await writeFile(path.join(evidence, 'signal-tests.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  interrupt();
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      await Promise.race([stopped, pause(7000)]);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }
  // If a regression killed the qualifier before its finally, the test must not leak its known runtime.
  for (const pid of ownedRuntimes) {
    const alive = () => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; } };
    for (const signal of ['SIGTERM', 'SIGKILL']) {
      if (!alive()) break;
      try { process.kill(-pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      const deadline = Date.now() + 3000;
      while (alive() && Date.now() < deadline) await pause(30);
    }
    if (alive()) throw Error('owned_signal_test_runtime_still_alive');
  }
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
}
