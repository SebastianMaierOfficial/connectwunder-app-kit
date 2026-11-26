import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createWorkspaceAppAuth, SESSION_COOKIE, FLOW_COOKIE } from '../src/auth.js';

const origin = 'https://sample-app.example.invalid';
const issuer = 'https://auth.example.invalid';
const scopes = ['apps.identity.read', 'apps.navigation.read', 'apps.boards.read'];
const fixed = { appOrigin: origin, issuer, resource: 'https://api.example.invalid/api/workspace-apps/v1', clientId: 'cw_wa_beta_synthetic', authorizationEndpoint: issuer + '/oauth/authorize', tokenEndpoint: issuer + '/oauth/token', revocationEndpoint: issuer + '/oauth/revoke', scopes, crypto: webcrypto };
const req = (path = '/', cookie, options = {}) => new Request(origin + path, { ...options, headers: { ...(cookie ? { cookie } : {}), ...(options.headers || {}) } });
function lines(result) { return result.headers.getSetCookie?.() || (result.headers.get('set-cookie') || '').split(/,(?=\s*__Host-)/u); }
function cookie(result, name) { return lines(result).map(line => line.trim().split(';')[0]).find(value => value.startsWith(name + '=')); }
function decode(value) { return JSON.parse(Buffer.from(value.split('=').slice(1).join('='), 'base64url').toString()); }
function makeProvider() {
  let sequence = 0;
  const access = new Map(), refresh = new Map(), revoked = new Set();
  const fixture = { now: 1_800_000_000_000, refreshCalls: 0, policyActive: true };
  function issue(user, family = `family-${++sequence}`) {
    const a = `cw_at_${user}_${++sequence}_synthetic_only`, r = `cw_rt_${user}_${sequence}_synthetic_only`;
    access.set(a, { user, family, expired: false });
    refresh.set(r, { user, family, next: null, until: 0 });
    return { a, r };
  }
  const body = pair => Response.json({ access_token: pair.a, refresh_token: pair.r, token_type: 'Bearer', expires_in: 900, scope: scopes.join(' ') });
  fixture.fetch = async (url, options) => {
    assert.equal(options.redirect, 'manual');
    const form = new URLSearchParams(options.body);
    assert.equal(form.get('client_id'), fixed.clientId);
    if (url === fixed.revocationEndpoint) {
      const current = refresh.get(form.get('token'));
      if (current) revoked.add(current.family);
      return new Response(null, { status: 200 });
    }
    assert.equal(url, fixed.tokenEndpoint);
    assert.equal(form.get('resource'), fixed.resource);
    if (form.get('grant_type') === 'authorization_code') {
      assert.equal(form.get('redirect_uri'), origin + '/auth/connectwunder/callback');
      const verifier = form.get('code_verifier');
      assert.match(verifier, /^[A-Za-z0-9_-]{43}$/u);
      return body(issue(form.get('code') === 'synthetic-code-b' ? 'user-b' : 'user-a'));
    }
    assert.equal(form.get('grant_type'), 'refresh_token');
    fixture.refreshCalls++;
    const current = refresh.get(form.get('refresh_token'));
    if (!current || !fixture.policyActive || revoked.has(current.family)) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    if (current.next) {
      if (fixture.now > current.until) return Response.json({ error: 'invalid_grant' }, { status: 400 });
      let next = current.next;
      while (refresh.get(next.r).next) next = refresh.get(next.r).next;
      return body(next);
    }
    const next = issue(current.user, current.family);
    current.next = next;
    current.until = fixture.now + 120_000;
    return body(next);
  };
  fixture.useToken = async token => {
    const current = access.get(token);
    if (!current || current.expired || !fixture.policyActive || revoked.has(current.family)) return Response.json({ error: 'unauthorized' }, { status: 401 });
    return Response.json({ principal: current.user });
  };
  fixture.expire = token => { access.get(token).expired = true; };
  fixture.auth = config => createWorkspaceAppAuth({ ...fixed, fetch: fixture.fetch, now: () => fixture.now, ...config });
  return fixture;
}
async function login(auth, code = 'synthetic-code-a', oldCookie) {
  const launch = await auth.launch(req('/auth/connectwunder/launch', oldCookie));
  assert.equal(launch.status, 303);
  const location = new URL(launch.headers.get('location'));
  const callback = req('/auth/connectwunder/callback?' + new URLSearchParams({ code, state: location.searchParams.get('state') }), cookie(launch, FLOW_COOKIE));
  const result = await auth.callback(callback);
  assert.equal(result.status, 303);
  return { launch, callback, result, session: cookie(result, SESSION_COOKIE), location };
}

test('public PKCE flow returns a host-only session without exposing tokens in application JSON', async () => {
  const f = makeProvider(), auth = f.auth();
  const logged = await login(auth);
  assert.equal(logged.location.searchParams.get('resource'), fixed.resource);
  assert.equal(logged.location.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(logged.location.searchParams.get('client_secret'), null);
  const flow = decode(cookie(logged.launch, FLOW_COOKIE));
  const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(flow.p));
  assert.equal(Buffer.from(digest).toString('base64url'), logged.location.searchParams.get('code_challenge'));
  const sessionLine = lines(logged.result).find(line => line.startsWith(SESSION_COOKIE + '='));
  assert.match(sessionLine, /; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=/u);
  assert.equal(sessionLine.includes('Domain='), false);
  assert.deepEqual(Object.keys(decode(logged.session)).sort(), ['a', 'r', 'v']);
  const result = await auth.withAccessToken(req('/', logged.session), f.useToken);
  assert.deepEqual(await result.json(), { principal: 'user-a' });
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.has('set-cookie'), false);
  assert.equal(f.refreshCalls, 0);
});

test('CW launch never reuses existing app user B when the current provider user is A', async () => {
  const f = makeProvider(), auth = f.auth();
  const old = await login(auth, 'synthetic-code-b');
  const direct = await auth.withAccessToken(req('/', old.session), f.useToken);
  assert.deepEqual(await direct.json(), { principal: 'user-b' });
  const switched = await login(auth, 'synthetic-code-a', old.session);
  assert.match(lines(switched.launch).find(line => line.startsWith(SESSION_COOKIE + '=')), /Max-Age=0/u);
  assert.notEqual(switched.session, old.session);
  assert.deepEqual(await (await auth.withAccessToken(req('/', switched.session), f.useToken)).json(), { principal: 'user-a' });
});

test('callback rejects mismatched, duplicate or expired state before token exchange', async () => {
  const f = makeProvider(), auth = f.auth();
  const launch = await auth.launch(req('/auth/connectwunder/launch'));
  const flowCookie = cookie(launch, FLOW_COOKIE);
  for (const query of ['code=x&state=wrong', 'code=x&state=one&state=two', 'error=access_denied']) {
    assert.equal((await auth.callback(req('/auth/connectwunder/callback?' + query, flowCookie))).status, 400);
  }
  const state = new URL(launch.headers.get('location')).searchParams.get('state');
  f.now += 301_000;
  assert.equal((await auth.callback(req('/auth/connectwunder/callback?code=x&state=' + state, flowCookie))).status, 400);
});

test('return routes are an explicit allowlist; caller URL hints cannot expand it', async () => {
  const f = makeProvider(), auth = f.auth();
  for (const target of ['https://other.example.invalid/', '//other.example.invalid/', '/not-approved', '/%2f%2fother.example.invalid', '/auth/connectwunder/launch']) {
    assert.equal((await auth.launch(req('/auth/connectwunder/launch'), target)).status, 400);
  }
  const launch = await auth.launch(req('/auth/connectwunder/launch?userId=not-authority&returnTo=https://other.example.invalid'));
  assert.equal(decode(cookie(launch, FLOW_COOKIE)).r, '/');
  assert.equal(new URL(launch.headers.get('location')).searchParams.has('userId'), false);
});

test('two parallel expired-token calls converge to one refresh successor', async () => {
  const f = makeProvider(), auth = f.auth();
  const logged = await login(auth);
  f.expire(decode(logged.session).a);
  const results = await Promise.all([1, 2].map(() => auth.withAccessToken(req('/', logged.session), f.useToken)));
  assert.deepEqual(results.map(result => result.status), [200, 200]);
  const sessions = results.map(result => cookie(result, SESSION_COOKIE));
  assert.equal(decode(sessions[0]).r, decode(sessions[1]).r);
  assert.equal(f.refreshCalls, 2);
  for (const result of results) assert.deepEqual(await result.json(), { principal: 'user-a' });
});

test('a reordered older cookie heals only within the explicitly bounded replay window', async () => {
  const f = makeProvider(), auth = f.auth();
  const original = await login(auth);
  f.expire(decode(original.session).a);
  const first = await auth.withAccessToken(req('/', original.session), f.useToken);
  const generationOne = cookie(first, SESSION_COOKIE);
  f.expire(decode(generationOne).a);
  const second = await auth.withAccessToken(req('/', generationOne), f.useToken);
  const generationTwo = cookie(second, SESSION_COOKIE);
  // Simulate the first response arriving after the second response at the browser.
  const recovered = await auth.withAccessToken(req('/', generationOne), f.useToken);
  assert.equal(recovered.status, 200);
  assert.equal(decode(cookie(recovered, SESSION_COOKIE)).r, decode(generationTwo).r);
  f.now += 120_001;
  const expiredReplay = await auth.withAccessToken(req('/', generationOne), f.useToken);
  assert.equal(expiredReplay.status, 401);
  assert.equal(expiredReplay.headers.has('location'), false);
  assert.match(lines(expiredReplay)[0], /Max-Age=0/u);
});

test('revoked policy refresh fails cleanly without redirect loops or resource retries', async () => {
  const f = makeProvider(), auth = f.auth();
  const logged = await login(auth);
  f.policyActive = false;
  let calls = 0;
  const result = await auth.withAccessToken(req('/', logged.session), token => { calls++; return f.useToken(token); });
  assert.equal(result.status, 401);
  assert.equal(calls, 1);
  assert.equal(f.refreshCalls, 1);
  assert.equal(result.headers.has('location'), false);
});

test('a provider grant revocation stops a cookie restored by a delayed refresh response after logout', async () => {
  const f = makeProvider(), auth = f.auth();
  const original = await login(auth);
  f.expire(decode(original.session).a);
  const delayed = await auth.withAccessToken(req('/', original.session), f.useToken);
  const logout = await auth.logout(req('/logout', original.session, { method: 'POST', headers: { origin } }));
  assert.equal(logout.status, 204);
  const restored = await auth.withAccessToken(req('/', cookie(delayed, SESSION_COOKIE)), f.useToken);
  assert.equal(restored.status, 401);
});

test('all cookie-authenticated mutations require exact Origin, including logout', async () => {
  const f = makeProvider(), auth = f.auth();
  const logged = await login(auth);
  let writes = 0;
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    const bad = await auth.withAccessToken(req('/', logged.session, { method, headers: { origin: 'https://other.example.invalid' } }), () => { writes++; return Response.json({ ok: true }); });
    assert.equal(bad.status, 401);
  }
  assert.equal(writes, 0);
  assert.equal((await auth.logout(req('/logout', logged.session, { method: 'POST' }))).status, 401);
  assert.equal((await auth.withAccessToken(req('/', logged.session, { method: 'POST', headers: { origin } }), () => { writes++; return Response.json({ ok: true }); })).status, 200);
  assert.equal(writes, 1);
});

test('timeout preserves cookies and leaves draft-preserving recovery to the application', async () => {
  const f = makeProvider(), auth = f.auth({ timeoutMs: 20 });
  const logged = await login(auth);
  const result = await auth.withAccessToken(req('/', logged.session), async (_token, signal) => new Promise(resolve => signal.addEventListener('abort', () => resolve(new Response(null, { status: 503 })), { once: true })));
  assert.equal(result.status, 503);
  assert.equal(result.headers.has('set-cookie'), false);
  assert.equal(result.headers.has('location'), false);
});

test('missing or malformed sessions do not call the provider or reveal credentials', async () => {
  const f = makeProvider(), auth = f.auth();
  for (const supplied of [undefined, SESSION_COOKIE + '=invalid', SESSION_COOKIE + '=one; ' + SESSION_COOKIE + '=two']) {
    const result = await auth.withAccessToken(req('/', supplied), f.useToken);
    assert.equal(result.status, 401);
    assert.deepEqual(await result.json(), { error: 'session_required' });
  }
  assert.equal(f.refreshCalls, 0);
});

test('configuration rejects broad scopes, cross-origin endpoints and excessive timeouts', () => {
  const f = makeProvider();
  for (const extra of [{ scopes: ['mcp.full'] }, { tokenEndpoint: 'https://other.example.invalid/token' }, { resource: 'https://api.example.invalid/api' }, { timeoutMs: 10_001 }, { allowedReturnPaths: ['//other.example.invalid/'] }, { appOrigin: 'https://sample-app.example.invalid/path' }]) {
    assert.throws(() => f.auth(extra));
  }
});

test('logout without an app session is harmless and idempotent', async () => {
  const f = makeProvider(), auth = f.auth();
  assert.equal((await auth.logout(req('/logout', undefined, { method: 'POST', headers: { origin } }))).status, 204);
});

test('every token endpoint 3xx is rejected before parsing and redirect bodies are canceled', async () => {
  for (let status = 300; status < 400; status++) {
    let canceled = 0, calls = 0;
    const auth = createWorkspaceAppAuth({ ...fixed, fetch: async (_url, options) => {
      calls++;
      assert.equal(options.redirect, 'manual');
      const body = status === 304 ? null : new ReadableStream({ cancel() { canceled++; } });
      return new Response(body, { status, headers: { location: 'https://trap.example.invalid/credentials' } });
    } });
    const launch = await auth.launch(req('/auth/connectwunder/launch'));
    const state = new URL(launch.headers.get('location')).searchParams.get('state');
    const result = await auth.callback(req('/auth/connectwunder/callback?code=synthetic-code&state=' + state, cookie(launch, FLOW_COOKIE)));
    assert.equal(result.status, 503, String(status));
    assert.equal(result.headers.has('set-cookie'), false);
    assert.equal(result.headers.has('location'), false);
    assert.equal(calls, 1);
    assert.equal(canceled, status === 304 ? 0 : 1);
  }
});

test('refresh and revocation redirects are canceled, preserve the session and never retry another target', async () => {
  const fixture = makeProvider();
  const auth = fixture.auth();
  const logged = await login(auth);
  fixture.expire(decode(logged.session).a);
  for (let status = 300; status < 400; status++) {
    let canceled = 0, calls = 0;
    const blocked = fixture.auth({ fetch: async (_url, options) => {
      calls++;
      assert.equal(options.redirect, 'manual');
      return new Response(status === 304 ? null : new ReadableStream({ cancel() { canceled++; } }), { status, headers: { location: 'https://trap.example.invalid/credentials' } });
    } });
    const refreshed = await blocked.withAccessToken(req('/', logged.session), fixture.useToken);
    const revoked = await blocked.logout(req('/logout', logged.session, { method: 'POST', headers: { origin } }));
    for (const result of [refreshed, revoked]) {
      assert.equal(result.status, 503, String(status));
      assert.equal(result.headers.has('set-cookie'), false);
      assert.equal(result.headers.has('location'), false);
    }
    assert.equal(calls, 2);
    assert.equal(canceled, status === 304 ? 0 : 2);
  }
});

test('native global fetch aliases keep their receiver while custom bound injections stay untouched', async () => {
  const priorGlobal = globalThis.fetch, fixture = makeProvider();
  globalThis.fetch = async function (...args) {
    assert.equal(this, globalThis);
    return fixture.fetch(...args);
  };
  try {
    for (const explicitAlias of [false, true]) {
      const auth = createWorkspaceAppAuth({ ...fixed, ...(explicitAlias ? { fetch: globalThis.fetch } : {}) });
      assert.equal((await login(auth)).result.status, 303);
    }
    const ownReceiver = {};
    const custom = (async function (...args) { assert.equal(this, ownReceiver); return fixture.fetch(...args); }).bind(ownReceiver);
    const auth = createWorkspaceAppAuth({ ...fixed, fetch: custom });
    assert.equal((await login(auth)).result.status, 303);
  } finally { globalThis.fetch = priorGlobal; }
});


test('approved write scope configuration is opt-in and token responses remain exact', async () => {
 const writes = ['apps.boards.items.create','apps.boards.items.fields.write','apps.boards.notes.create'];
 const base = makeProvider();
 const read = await base.auth().launch(req('/auth/connectwunder/launch'));
 assert.deepEqual(new URL(read.headers.get('location')).searchParams.get('scope').split(' '), [...scopes].sort());
 for (const chosen of writes.map(value => [value]).concat([writes])) {
  const configured = [...scopes,...chosen];
  let returned = configured.join(' ');
  const auth = createWorkspaceAppAuth({...fixed,scopes:configured,fetch:async()=>Response.json({access_token:'cw_at_synthetic_write_only',refresh_token:'cw_rt_synthetic_write_only',token_type:'Bearer',expires_in:900,scope:returned})});
  const accepted = await login(auth);
  assert.deepEqual(accepted.location.searchParams.get('scope').split(' '), [...configured].sort());
  for (const mismatch of [scopes.join(' '),configured.join(' ')+' mcp.full',configured.join(' ')+' '+chosen[0]]) {
   returned=mismatch;
   const launch=await auth.launch(req('/auth/connectwunder/launch'));
   const state=new URL(launch.headers.get('location')).searchParams.get('state');
   const denied=await auth.callback(req('/auth/connectwunder/callback?code=synthetic-code&state='+state,cookie(launch,FLOW_COOKIE)));
   assert.equal(denied.status,503);
   assert.equal(denied.headers.has('set-cookie'),false);
  }
 }
 for (const scope of ['apps.boards.write','apps.boards.items.delete','identity.workspace.read','mcp.full']) assert.throws(()=>base.auth({scopes:[...scopes,scope]}));
});


// Advance only controlled deadline timers; login/Web Crypto completes before clock mocking.
const flushDeadlines = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function cancelableResponse(status, canceled) { return new Response(new ReadableStream({ cancel: canceled }), { status }); }

test('operation deadline defaults to10s and explicitly permits60s without a late401 refresh', async t => {
  for (const deadline of [10_000, 60_000]) {
    const f = makeProvider(), auth = f.auth(deadline === 10_000 ? {} : { operationTimeoutMs: deadline });
    const logged = await login(auth), late = deferred();
    let settled = false, signal, calls = 0, canceled = 0;
    t.mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const pending = auth.withAccessToken(req('/', logged.session), (_token, currentSignal) => { calls++; signal = currentSignal; return late.promise; }).then(result => { settled = true; return result; });
      await flushDeadlines(); t.mock.timers.tick(deadline - 1); await flushDeadlines(); assert.equal(settled, false);
      t.mock.timers.tick(1); const result = await pending;
      assert.equal(result.status, 503); assert.equal(signal.aborted, true); assert.equal(result.headers.has('set-cookie'), false); assert.equal(result.headers.has('location'), false);
      late.resolve(cancelableResponse(401, () => { canceled++; })); await flushDeadlines();
      assert.equal(canceled, 1); assert.equal(calls, 1); assert.equal(f.refreshCalls, 0);
    } finally { t.mock.timers.reset(); }
  }
});

test('operation timeout rejects invalid values and keeps the original network cap', () => {
  const f = makeProvider();
  for (const operationTimeoutMs of [0, -1, 60_001, 1.5, '60000', NaN, Infinity]) assert.throws(() => f.auth({ operationTimeoutMs }));
  assert.doesNotThrow(() => f.auth({ operationTimeoutMs: 60_000 }));
  assert.throws(() => f.auth({ operationTimeoutMs: 60_000, timeoutMs: 10_001 }));
});

test('a long operation still gives refresh only10s and cancels its late response without retry', async t => {
  const f = makeProvider(), logged = await login(f.auth()), late = deferred();
  f.expire(decode(logged.session).a);
  let networkSignal, calls = 0, canceled = 0, settled = false;
  const auth = f.auth({ operationTimeoutMs: 60_000, fetch: (_url, options) => { networkSignal = options.signal; return late.promise; } });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = auth.withAccessToken(req('/', logged.session), token => { calls++; return f.useToken(token); }).then(result => { settled = true; return result; });
  await flushDeadlines(); assert.ok(networkSignal); t.mock.timers.tick(9_999); await flushDeadlines(); assert.equal(settled, false);
  t.mock.timers.tick(1); const result = await pending;
  assert.equal(result.status, 503); assert.equal(networkSignal.aborted, true); assert.equal(result.headers.has('set-cookie'), false);
  late.resolve(cancelableResponse(200, () => { canceled++; })); await flushDeadlines();
  assert.equal(canceled, 1); assert.equal(calls, 1);
});

test('parent request and total operation deadlines abort an in-flight refresh before another callback', async t => {
  for (const mode of ['request', 'operation']) {
    const f = makeProvider(), logged = await login(f.auth()), first = deferred(), late = deferred(), parent = new AbortController();
    let networkSignal, calls = 0, canceled = 0;
    const auth = f.auth({ operationTimeoutMs: 60_000, fetch: (_url, options) => { networkSignal = options.signal; return late.promise; } });
    t.mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const pending = auth.withAccessToken(req('/', logged.session, { signal: parent.signal }), () => { calls++; return first.promise; });
      await flushDeadlines(); if (mode === 'operation') t.mock.timers.tick(55_000);
      first.resolve(new Response(null, { status: 401 })); await flushDeadlines(); assert.ok(networkSignal); assert.equal(networkSignal.aborted, false);
      if (mode === 'request') parent.abort(); else t.mock.timers.tick(5_000);
      const result = await pending; assert.equal(result.status, 503); assert.equal(networkSignal.aborted, true); assert.equal(result.headers.has('set-cookie'), false);
      late.resolve(cancelableResponse(200, () => { canceled++; })); await flushDeadlines(); assert.equal(canceled, 1); assert.equal(calls, 1);
    } finally { t.mock.timers.reset(); }
  }
});

test('a pre-aborted request does not invoke its callback or provider', async () => {
  const f = makeProvider(), auth = f.auth({ operationTimeoutMs: 60_000 }), logged = await login(auth), parent = new AbortController();
  parent.abort(); let calls = 0;
  const result = await auth.withAccessToken(req('/', logged.session, { signal: parent.signal }), () => { calls++; return Response.json({ ok: true }); });
  assert.equal(result.status, 503); assert.equal(calls, 0); assert.equal(f.refreshCalls, 0); assert.equal(result.headers.has('set-cookie'), false);
});

test('a successful operation past10s refreshes once and preserves rotated cookie semantics', async t => {
  const f = makeProvider(), auth = f.auth({ operationTimeoutMs: 60_000 }), logged = await login(auth), first = deferred();
  f.expire(decode(logged.session).a); let calls = 0;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = auth.withAccessToken(req('/', logged.session), token => { calls++; return calls === 1 ? first.promise : f.useToken(token); });
  await flushDeadlines(); t.mock.timers.tick(11_000); first.resolve(new Response(null, { status: 401 }));
  const result = await pending; assert.equal(result.status, 200); assert.equal(calls, 2); assert.equal(f.refreshCalls, 1);
  assert.notEqual(decode(cookie(result, SESSION_COOKIE)).r, decode(logged.session).r); assert.deepEqual(await result.json(), { principal: 'user-a' }); assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('a timed-out retry cancels its late body and never performs a second refresh', async t => {
  const f = makeProvider(), auth = f.auth({ operationTimeoutMs: 60_000 }), logged = await login(auth), late = deferred();
  f.expire(decode(logged.session).a); let calls = 0, canceled = 0;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = auth.withAccessToken(req('/', logged.session), token => { calls++; return calls === 1 ? f.useToken(token) : late.promise; });
  await flushDeadlines(); assert.equal(calls, 2); assert.equal(f.refreshCalls, 1);
  t.mock.timers.tick(60_000); assert.equal((await pending).status, 503);
  late.resolve(cancelableResponse(401, () => { canceled++; })); await flushDeadlines(); assert.equal(canceled, 1); assert.equal(calls, 2); assert.equal(f.refreshCalls, 1);
});

test('long-operation opt-in does not extend callback or revoke HTTP deadlines', async t => {
  const f = makeProvider(), logged = await login(f.auth()); let networkSignal;
  const auth = f.auth({ operationTimeoutMs: 60_000, fetch: (_url, options) => { networkSignal = options.signal; return new Promise(() => {}); } });
  const launch = await auth.launch(req('/auth/connectwunder/launch'));
  const callback = req('/auth/connectwunder/callback?' + new URLSearchParams({ code: 'synthetic-code-a', state: new URL(launch.headers.get('location')).searchParams.get('state') }), cookie(launch, FLOW_COOKIE));
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const run of [() => auth.callback(callback), () => auth.logout(req('/logout', logged.session, { method: 'POST', headers: { origin } }))]) {
    const pending = run(); await flushDeadlines(); t.mock.timers.tick(10_000); const result = await pending;
    assert.equal(result.status, 503); assert.equal(networkSignal.aborted, true); assert.equal(result.headers.has('set-cookie'), false);
  }
});


test('refresh deadline cancels a stalled token response body after headers arrived', async t => {
  const f = makeProvider(), logged = await login(f.auth()); f.expire(decode(logged.session).a);
  let canceled = 0, calls = 0;
  const body = new ReadableStream({ cancel() { canceled++; } });
  const auth = f.auth({ operationTimeoutMs: 60_000, fetch: async () => new Response(body, { status: 200 }) });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = auth.withAccessToken(req('/', logged.session), token => { calls++; return f.useToken(token); });
  await flushDeadlines(); assert.equal(body.locked, true); t.mock.timers.tick(10_000);
  const result = await pending; await flushDeadlines(); assert.equal(result.status, 503); assert.equal(canceled, 1); assert.equal(calls, 1); assert.equal(result.headers.has('set-cookie'), false); assert.equal(body.locked, false);
});


test('one-use candidate invokes exactly once even for401, preserves old session and ordinary refresh remains available',async()=>{
 const f=makeProvider(),auth=f.auth(),logged=await login(auth);f.expire(decode(logged.session).a);let calls=0;
 const candidate=await auth.withCandidateAccessTokenOnce(req('/resume',logged.session,{method:'POST',headers:{origin}}),(token,signal)=>{calls++;assert.equal(signal.aborted,false);return f.useToken(token);});
 assert.equal(candidate.status,401);assert.equal(calls,1);assert.equal(f.refreshCalls,0);assert.equal(candidate.headers.has('set-cookie'),false);
 const ordinary=await auth.withAccessToken(req('/',logged.session),f.useToken);assert.equal(ordinary.status,200);assert.equal(f.refreshCalls,1);assert.ok(cookie(ordinary,SESSION_COOKIE));
});
test('candidate missing/malformed/duplicate cookie and foreign Origin never call provider or erase the old cookie',async()=>{
 const f=makeProvider(),auth=f.auth(),logged=await login(auth);let calls=0;
 for(const [value,requestOrigin]of [[undefined,origin],[SESSION_COOKIE+'=invalid',origin],[logged.session+'; '+logged.session,origin],[logged.session,'https://other.example.invalid']]){
  const result=await auth.withCandidateAccessTokenOnce(req('/resume',value,{method:'POST',headers:{origin:requestOrigin}}),()=>{calls++;return Response.json({ok:true});});
  assert.equal(result.status,401);assert.equal(result.headers.has('set-cookie'),false);assert.equal(result.headers.has('location'),false);
 }
 assert.equal(calls,0);assert.equal(f.refreshCalls,0);assert.equal((await auth.withAccessToken(req('/',logged.session),f.useToken)).status,200);
});
test('candidate never forwards callback Set-Cookie or retries a lost one-use response',async()=>{
 const f=makeProvider(),auth=f.auth(),logged=await login(auth);let calls=0;
 const successful=await auth.withCandidateAccessTokenOnce(req('/',logged.session),()=>{calls++;return Response.json({initial:true},{headers:{'set-cookie':SESSION_COOKIE+'=changed','x-sample':'retained'}});});
 assert.equal(successful.status,200);assert.equal(successful.headers.has('set-cookie'),false);assert.equal(successful.headers.get('x-sample'),'retained');assert.equal(successful.headers.get('cache-control'),'no-store');
 const lost=await auth.withCandidateAccessTokenOnce(req('/',logged.session),()=>{calls++;throw Error('Sample reply lost after consume');});
 assert.equal(lost.status,503);assert.equal(calls,2);assert.equal(f.refreshCalls,0);assert.equal(lost.headers.has('set-cookie'),false);
});
test('candidate parent abort/deadline cancels late successful body with no retry/refresh or cookie mutation',async t=>{
 for(const mode of ['parent','deadline']){
  const f=makeProvider(),auth=f.auth(),logged=await login(auth),late=deferred(),parent=new AbortController();let calls=0,canceled=0,signal;
  t.mock.timers.enable({apis:['setTimeout']});
  try{
   const pending=auth.withCandidateAccessTokenOnce(req('/',logged.session,{signal:parent.signal}),(_token,s)=>{calls++;signal=s;return late.promise;});
   await flushDeadlines();if(mode==='parent')parent.abort();else t.mock.timers.tick(10000);
   const result=await pending;assert.equal(result.status,503);assert.equal(signal.aborted,true);assert.equal(result.headers.has('set-cookie'),false);
   late.resolve(cancelableResponse(200,()=>{canceled++;}));await flushDeadlines();assert.equal(canceled,1);assert.equal(calls,1);assert.equal(f.refreshCalls,0);
  }finally{t.mock.timers.reset();}
 }
});
test('reporting scope is allowed only when explicitly configured',()=>{
 assert.doesNotThrow(()=>createWorkspaceAppAuth({...fixed,scopes:[...scopes,'apps.results.import']}));
});
