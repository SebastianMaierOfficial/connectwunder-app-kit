/** Actual native workerd fetch to owned loopback HTTP servers. No downloads or injected fetch. */
import { createServer } from 'node:http';
import { createServer as portServer } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

async function freePort() {
  const server = portServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function loopbackPair(handler) {
  const ipv4 = createServer(handler), ipv6 = createServer(handler);
  try {
    await new Promise((resolve, reject) => { ipv4.once('error', reject); ipv4.listen(0, '127.0.0.1', resolve); });
    const port = ipv4.address().port;
    await new Promise((resolve, reject) => { ipv6.once('error', reject); ipv6.listen(port, '::1', resolve); });
    return { port, servers: [ipv4, ipv6] };
  } catch (error) { ipv4.close(); ipv6.close(); throw error; }
}

function childExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}
async function waitForExit(child, milliseconds) {
  if (childExited(child)) return true;
  return new Promise(resolve => {
    const finish = value => { clearTimeout(timer); child.removeListener('exit', exited); resolve(value); };
    const exited = () => finish(true);
    const timer = setTimeout(() => finish(childExited(child)), milliseconds);
    child.once('exit', exited);
    if (childExited(child)) finish(true);
  });
}
export async function stopOwnedRuntime(child) {
  if (!child || !Number.isSafeInteger(child.pid) || childExited(child)) return;
  const signal = name => { try { process.kill(-child.pid, name); } catch (error) { if (error.code !== 'ESRCH') throw error; } };
  signal('SIGTERM');
  if (!await waitForExit(child, 3000)) {
    signal('SIGKILL');
    if (!await waitForExit(child, 3000)) throw Error('owned_workerd_did_not_exit');
  }
}

export async function qualifyNativeWorker({ binary, scratch, evidence, holdProviderProbe = false }) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  let port, appOrigin;
  const counts = { providerRequests: 0, successfulCallbacks: 0, successfulRefreshes: 0, successfulRevokes: 0,
    identityReads: 0, redirectsReturned: 0, trapRequests: 0, trapCredentialSeen: false, invalidForms: 0, unsupportedErrorRequests: 0 };
  const access = new Map(), refresh = new Map(), revoked = new Set();
  let sequence = 0, providerOrigin, trapOrigin, child, logs = '', result, failure, canceledBy;
  const cancellation = new AbortController();
  const ports = [];
  const canceledError = () => Object.assign(Error('qualification_canceled'), { code: 'qualification_canceled' });
  const assertActive = () => { if (canceledBy) throw canceledError(); if (cancellation.signal.aborted) throw cancellation.signal.reason; };
  const interrupt = signal => {
    canceledBy ||= signal;
    cancellation.abort(canceledError());
    if (child && Number.isSafeInteger(child.pid) && !childExited(child)) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') failure ||= error; }
    }
  };
  const onTerm = () => interrupt('SIGTERM'), onInt = () => interrupt('SIGINT');
  process.on('SIGTERM', onTerm); process.on('SIGINT', onInt);
  const servers = [];
  function issue(family = 'synthetic-family-' + ++sequence) {
    const pair = { a: 'cw_at_native_' + ++sequence + '_synthetic_only', r: 'cw_rt_native_' + sequence + '_synthetic_only', family, expired: false };
    access.set(pair.a, pair); refresh.set(pair.r, pair);
    return { access_token: pair.a, refresh_token: pair.r, token_type: 'Bearer', expires_in: 900, scope: 'apps.identity.read apps.navigation.read' };
  }
  const send = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(data ? JSON.stringify(data) : undefined); };
  async function provider(req, res) {
    counts.providerRequests++;
    try {
      const pathname = new URL(req.url, providerOrigin).pathname;
      if (pathname === '/fixture/probe') {
        if (holdProviderProbe) {
          await writeFile(path.join(evidence, 'native-lifecycle.json'), JSON.stringify({ phase: 'native_http_probe_pending', runtimePid: child.pid, ports }) + '\n');
          return; // The real HTTP request stays open until signal-driven cleanup closes its socket.
        }
        send(res, 200, { nativeNetwork: true }); return;
      }
      if (pathname === '/fixture/expire') { for (const value of access.values()) value.expired = true; send(res, 204); return; }
      if (pathname === '/fixture/unsupported-error') { counts.unsupportedErrorRequests++; send(res, 200, { ok: true }); return; }
      let text = '';
      for await (const chunk of req) { text += chunk; if (text.length > 16384) throw Error('synthetic_request_too_large'); }
      const form = new URLSearchParams(text);
      const isToken = pathname.endsWith('/oauth/token'), isRevoke = pathname.endsWith('/oauth/revoke');
      if (isToken || isRevoke) {
        if (req.method !== 'POST' || form.get('client_id') !== 'cw_wa_beta_synthetic_native') throw Error('invalid_synthetic_form');
        if (isToken && form.get('resource') !== providerOrigin + '/api/workspace-apps/v1') throw Error('invalid_synthetic_resource');
      }
      if (isToken && form.get('grant_type') === 'authorization_code'
        && (form.get('code') !== 'synthetic-native-code' || form.get('redirect_uri') !== appOrigin + '/auth/connectwunder/callback' || !/^[A-Za-z0-9_-]{43}$/u.test(form.get('code_verifier') || ''))) throw Error('invalid_synthetic_pkce');
      const redirect = pathname.match(/^\/redirect\/(3\d\d)\//u);
      if (redirect) {
        counts.redirectsReturned++;
        const status = Number(redirect[1]);
        res.writeHead(status, { location: trapOrigin + '/capture' });
        res.end(status === 304 ? undefined : 'Synthetic redirect body');
        return;
      }
      if (isToken) {
        if (form.get('grant_type') === 'authorization_code') { counts.successfulCallbacks++; send(res, 200, issue()); return; }
        const prior = refresh.get(form.get('refresh_token'));
        if (form.get('grant_type') !== 'refresh_token' || !prior || revoked.has(prior.family)) { send(res, 400, { error: 'invalid_grant' }); return; }
        counts.successfulRefreshes++; send(res, 200, issue(prior.family)); return;
      }
      if (isRevoke) {
        const prior = refresh.get(form.get('token'));
        if (!prior || form.get('token_type_hint') !== 'refresh_token') throw Error('invalid_synthetic_revoke');
        revoked.add(prior.family); counts.successfulRevokes++; send(res, 200); return;
      }
      if (pathname === '/identity') {
        counts.identityReads++;
        const pair = access.get(String(req.headers.authorization || '').replace(/^Bearer /u, ''));
        send(res, pair && !pair.expired && !revoked.has(pair.family) ? 200 : 401,
          pair && !pair.expired && !revoked.has(pair.family) ? { workspace: 'synthetic-workspace' } : { error: 'unauthorized' });
        return;
      }
      send(res, 404, { error: 'not_found' });
    } catch { counts.invalidForms++; send(res, 400, { error: 'invalid_synthetic_request' }); }
  }
  try {
    await mkdir(scratch);
    await mkdir(evidence, { recursive: true });
    assertActive();
    port = await freePort(); appOrigin = 'http://localhost:' + port; ports.push(port);
    assertActive();
    const trap = await loopbackPair(async (req, res) => {
      counts.trapRequests++;
      let body = ''; for await (const chunk of req) body += chunk;
      counts.trapCredentialSeen ||= !!req.headers.authorization || /(?:token|code_verifier|client_id)=/u.test(body);
      send(res, 200, { trap: true });
    });
    servers.push(...trap.servers); trapOrigin = 'http://localhost:' + trap.port; ports.push(trap.port); assertActive();
    const upstream = await loopbackPair((req, res) => { void provider(req, res); });
    servers.push(...upstream.servers); providerOrigin = 'http://localhost:' + upstream.port; ports.push(upstream.port); assertActive();
    const modules = [], hashes = {};
    for (const [index, file] of ['tests/fixtures/native-worker.js', 'src/auth.js'].entries()) {
      const bytes = await readFile(path.join(root, file)), embedded = 'native-' + index + '.js';
      await writeFile(path.join(scratch, embedded), bytes);
      hashes[file] = createHash('sha256').update(bytes).digest('hex');
      modules.push(`(name = ${JSON.stringify(file)}, esModule = embed ${JSON.stringify(embedded)})`);
    }
    // Native fetch can reach loopback IPs only. No public internet or private-LAN capability.
    const config = `using Workerd = import "/workerd/workerd.capnp";\nconst config :Workerd.Config = (services = [(name = "main", worker = (compatibilityDate = "2026-11-16", modules = [${modules.join(',')}], bindings = [(name = "PROVIDER_ORIGIN", text = ${JSON.stringify(providerOrigin)})])), (name = "internet", network = (allow = ["127.0.0.0/8", "::1/128"]))], sockets = [(name = "http", address = "127.0.0.1:${port}", http = (), service = "main")]);\n`;
    await writeFile(path.join(scratch, 'native.capnp'), config);
    child = spawn(binary, ['serve', path.join(scratch, 'native.capnp')], { cwd: scratch, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const collect = chunk => { if (logs.length < 65536) logs += chunk.toString().slice(0, 65536 - logs.length); };
    child.stdout.on('data', collect); child.stderr.on('data', collect);
    child.once('error', error => { failure ||= error; cancellation.abort(error); });
    let ready = false;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && !cancellation.signal.aborted && !childExited(child)) {
      try { const response = await fetch('http://127.0.0.1:' + port + '/health', { signal: AbortSignal.any([cancellation.signal, AbortSignal.timeout(1000)]) }); if (response.status === 200) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assertActive();
    if (!ready) throw Error('Native workerd did not become ready');
    const response = await fetch('http://127.0.0.1:' + port + '/qualify', { signal: AbortSignal.any([cancellation.signal, AbortSignal.timeout(45000)]) });
    result = await response.json();
    const networkChecks = { realTokenCallbackHttp: counts.successfulCallbacks >= 1, realRefreshHttp: counts.successfulRefreshes >= 1,
      realRevokeHttp: counts.successfulRevokes >= 1, realIdentityHttp: counts.identityReads >= 1,
      realRedirectResponses: counts.redirectsReturned === 36, receivingTrapNeverRequested: counts.trapRequests === 0,
      noCredentialForwardedToTrap: counts.trapCredentialSeen === false, exactRequestForms: counts.invalidForms === 0 };
    result = { ...result, nativeHttpCounters: counts, nativeNetworkChecks: networkChecks, sourceSha256: hashes,
      publicNetworkAllowed: false, actualHostedProviderTest: false,
      unsupportedErrorModeRejectedBeforeHttp: result.unsupportedErrorModeRejected === true && counts.unsupportedErrorRequests === 0 };
    assertActive();
    if (response.status !== 200 || result.status !== 'pass' || !Object.values(networkChecks).every(Boolean)) throw Error('Native HTTP qualification did not pass');
  } catch (error) {
    failure ||= error;
  } finally {
    try {
      try { await stopOwnedRuntime(child); } catch (error) { failure ||= error; }
      for (const server of servers) {
        try { server.closeAllConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
        catch (error) { failure ||= error; }
      }
      const cleanup = { runtimeExited: !child || childExited(child), serverListenersClosed: servers.every(server => !server.listening) };
      if (!cleanup.runtimeExited || !cleanup.serverListenersClosed) failure ||= Error('native_cleanup_unconfirmed');
      await mkdir(evidence, { recursive: true });
      await writeFile(path.join(evidence, 'native-workerd.log'), logs);
      await writeFile(path.join(evidence, 'native-http-counters.json'), JSON.stringify(counts, null, 2) + '\n');
      const final = () => canceledBy ? { status: 'canceled', canceledBy, cleanup, nativeHttpCounters: counts }
        : failure ? { ...result, status: 'fail', code: 'native_qualification_failed', cleanup, nativeHttpCounters: counts }
        : { ...result, cleanup };
      await writeFile(path.join(evidence, 'native-network.json'), JSON.stringify(final(), null, 2) + '\n');
      // A signal during evidence I/O must not leave a successful receipt behind.
      if (canceledBy) await writeFile(path.join(evidence, 'native-network.json'), JSON.stringify(final(), null, 2) + '\n');
      result = final();
    } finally {
      process.removeListener('SIGTERM', onTerm); process.removeListener('SIGINT', onInt);
    }
  }
  if (canceledBy) throw canceledError();
  if (failure) throw failure;
  return result;
}
