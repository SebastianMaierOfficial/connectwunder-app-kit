/** Small server-only OAuth helper. No framework, data client, secret key, or store. */
export const SESSION_COOKIE = '__Host-cw_app_session';
export const FLOW_COOKIE = '__Host-cw_app_flow';
const REQUIRED_SCOPE = 'apps.identity.read';
const PERMITTED_SCOPES = new Set([REQUIRED_SCOPE, 'apps.navigation.read', 'apps.boards.read', 'apps.boards.items.create', 'apps.boards.items.fields.write', 'apps.boards.notes.create']);
const MAX_TIMEOUT = 10_000;
const MAX_OPERATION_TIMEOUT = 60_000;
const FLOW_SECONDS = 300;
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();

export class WorkspaceAppAuthError extends Error {
  constructor(code) { super(code); this.name = 'WorkspaceAppAuthError'; this.code = code; }
}

function fail(code) { throw new WorkspaceAppAuthError(code); }
function bytes64(bytes) {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}
function object64(value) { return bytes64(encoder.encode(JSON.stringify(value))); }
function read64(value) {
  if (typeof value !== 'string' || value.length > 3_800 || !/^[A-Za-z0-9_-]+$/u.test(value)) fail('invalid_cookie');
  try {
    const text = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(text, c => c.charCodeAt(0))));
  } catch { fail('invalid_cookie'); }
}
function cookies(request) {
  const raw = request.headers.get('cookie') || '';
  if (raw.length > 16_384) fail('invalid_cookie');
  const found = new Map();
  for (const part of raw.split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    const name = part.slice(0, at).trim();
    if (name !== SESSION_COOKIE && name !== FLOW_COOKIE) continue;
    if (found.has(name)) fail('invalid_cookie');
    found.set(name, part.slice(at + 1).trim());
  }
  return found;
}
function token(value) {
  return typeof value === 'string' && value.length >= 16 && value.length <= 1_200 && /^[A-Za-z0-9._~-]+$/u.test(value);
}
function session(request) {
  const value = cookies(request).get(SESSION_COOKIE);
  if (!value) return null;
  const parsed = read64(value);
  if (!parsed || parsed.v !== 1 || !token(parsed.a) || !token(parsed.r) || Object.keys(parsed).sort().join(',') !== 'a,r,v') fail('invalid_cookie');
  return parsed;
}
function setCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
function response(status, message, cookieLines = [], location) {
  const headers = new Headers({ 'cache-control': 'no-store', 'pragma': 'no-cache', 'referrer-policy': 'no-referrer' });
  if (location) headers.set('location', location);
  if (!location) headers.set('content-type', 'application/json; charset=utf-8');
  for (const cookie of cookieLines) headers.append('set-cookie', cookie);
  return new Response(location || status === 204 ? null : JSON.stringify({ error: message }), { status, headers });
}
function denied(clear = true) {
  return response(401, 'session_required', clear ? [setCookie(SESSION_COOKIE, '', 0)] : []);
}
function noStore(upstream, cookieLines = []) {
  if (!(upstream instanceof Response)) fail('response_required');
  const headers = new Headers(upstream.headers);
  headers.set('cache-control', 'no-store');
  headers.set('pragma', 'no-cache');
  for (const cookie of cookieLines) headers.append('set-cookie', cookie);
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
}
function secureUrl(value, allowLocalhost = false) {
  let url;
  try { url = new URL(value); } catch { fail('configuration_invalid'); }
  const local = allowLocalhost && url.protocol === 'http:' && url.hostname === 'localhost';
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.hash || url.search) fail('configuration_invalid');
  return url;
}
function exactPath(path, origin) {
  if (typeof path !== 'string' || path.length > 1024 || !path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u0020]/u.test(path)) fail('return_path_invalid');
  let url;
  try { url = new URL(path, origin); } catch { fail('return_path_invalid'); }
  if (url.origin !== origin || url.pathname === '' || /%(?:2f|5c|00|0a|0d)/iu.test(path)) fail('return_path_invalid');
  return url.pathname + url.search + url.hash;
}
function configValue(input) {
  if (!input || typeof input !== 'object') fail('configuration_invalid');
  const local = input.allowLocalhost === true;
  const issuer = secureUrl(input.issuer, local);
  if (issuer.pathname !== '/') fail('configuration_invalid');
  const app = secureUrl(input.appOrigin, local);
  if (app.pathname !== '/') fail('configuration_invalid');
  const resource = secureUrl(input.resource, local);
  if (resource.pathname !== '/api/workspace-apps/v1') fail('configuration_invalid');
  const auth = secureUrl(input.authorizationEndpoint, local);
  const endpoint = secureUrl(input.tokenEndpoint, local);
  const revoke = secureUrl(input.revocationEndpoint, local);
  if ([auth, endpoint, revoke].some(url => url.origin !== issuer.origin)) fail('configuration_invalid');
  if (!Array.isArray(input.scopes) || !input.scopes.includes(REQUIRED_SCOPE) || input.scopes.some(scope => !PERMITTED_SCOPES.has(scope)) || new Set(input.scopes).size !== input.scopes.length) fail('configuration_invalid');
  if (typeof input.clientId !== 'string' || !/^[A-Za-z0-9_-]{8,160}$/u.test(input.clientId)) fail('configuration_invalid');
  const callbackPath = exactPath(input.callbackPath || '/auth/connectwunder/callback', app.origin);
  const launchPath = exactPath(input.launchPath || '/auth/connectwunder/launch', app.origin);
  if ([callbackPath, launchPath].some(path => /[?#]/u.test(path)) || callbackPath === launchPath) fail('configuration_invalid');
  const allowed = input.allowedReturnPaths || ['/'];
  if (!Array.isArray(allowed) || !allowed.length || allowed.length > 32) fail('configuration_invalid');
  const returns = allowed.map(path => exactPath(path, app.origin));
  if (returns.includes(callbackPath) || returns.includes(launchPath)) fail('configuration_invalid');
  const timeout = input.timeoutMs ?? MAX_TIMEOUT;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_TIMEOUT) fail('configuration_invalid');
  const operationTimeout = input.operationTimeoutMs ?? timeout;
  if (!Number.isInteger(operationTimeout) || operationTimeout < 1 || operationTimeout > MAX_OPERATION_TIMEOUT) fail('configuration_invalid');
  const cookieSeconds = input.sessionMaxAgeSeconds ?? SESSION_SECONDS;
  if (!Number.isInteger(cookieSeconds) || cookieSeconds < 1 || cookieSeconds > SESSION_SECONDS) fail('configuration_invalid');
  const cryptoApi = input.crypto ?? globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) fail('crypto_unavailable');
  const suppliedFetch = input.fetch ?? globalThis.fetch;
  const fetch = suppliedFetch === globalThis.fetch ? suppliedFetch.bind(globalThis) : suppliedFetch;
  return { issuer: issuer.origin, appOrigin: app.origin, resource: resource.href, authorizationEndpoint: auth.href, tokenEndpoint: endpoint.href, revocationEndpoint: revoke.href, clientId: input.clientId, scopes: [...input.scopes].sort(), callbackPath, launchPath, allowedReturnPaths: returns, timeout, operationTimeout, cookieSeconds, crypto: cryptoApi, fetch, now: input.now ?? Date.now };
}
function assertRequest(request, config) {
  if (!(request instanceof Request)) fail('request_required');
  if (new URL(request.url).origin !== config.appOrigin) fail('origin_invalid');
}
function assertMutationOrigin(request, config) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || request.headers.get('origin') !== config.appOrigin) fail('origin_invalid');
}
function assertActive(signal) {
  if (signal.aborted) fail('request_timeout');
}
async function guardedResponse(signal, work, invalidCode = 'provider_response_invalid') {
  assertActive(signal);
  const result = await work();
  if (signal.aborted) {
    if (result instanceof Response) { try { await result.body?.cancel(); } catch {} }
    fail('request_timeout');
  }
  if (!(result instanceof Response)) fail(invalidCode);
  return result;
}
async function limitedJson(result, signal) {
  if (!(result instanceof Response)) fail('provider_response_invalid');
  const reader = result.body?.getReader();
  if (!reader) fail('provider_response_invalid');
  const chunks = [];
  let length = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    if (signal.aborted) abort();
    assertActive(signal);
    while (true) {
      const item = await reader.read();
      assertActive(signal);
      if (item.done) break;
      length += item.value.byteLength;
      if (length > 16_384) { await reader.cancel(); fail('provider_response_invalid'); }
      chunks.push(item.value);
    }
  } finally { signal.removeEventListener('abort', abort); reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { fail('provider_response_invalid'); }
}
async function rejectProviderRedirect(result) {
  if (!(result instanceof Response)) fail('provider_response_invalid');
  if (result.status >= 300 && result.status < 400) {
    try { await result.body?.cancel(); } finally { fail('provider_redirect_denied'); }
  }
}
async function bounded(config, work, parentSignal, timeout = config.timeout) {
  const controller = new AbortController();
  let timer, rejectLimit;
  const abort = () => {
    rejectLimit(new WorkspaceAppAuthError('request_timeout'));
    controller.abort();
  };
  const limit = new Promise((_, reject) => {
    rejectLimit = reject;
    timer = setTimeout(abort, timeout);
  });
  parentSignal?.addEventListener('abort', abort, { once: true });
  try {
    if (parentSignal?.aborted) abort();
    const pending = Promise.resolve().then(() => { assertActive(controller.signal); return work(controller.signal); });
    return await Promise.race([pending, limit]);
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', abort);
  }
}
function random(config) { return bytes64(config.crypto.getRandomValues(new Uint8Array(32))); }
function safeFailure(error) {
  if (error instanceof WorkspaceAppAuthError && error.code === 'invalid_cookie') return denied();
  if (error instanceof WorkspaceAppAuthError && error.code === 'origin_invalid') return denied(false);
  return response(503, 'connection_unavailable');
}

/** Configuration endpoints come from the registered provider contract, never a URL parameter. */
export function createWorkspaceAppAuth(input) {
  const config = configValue(input);
  const sessionLine = value => setCookie(SESSION_COOKIE, object64(value), config.cookieSeconds);
  async function exchange(fields, signal, priorRefresh) {
    const result = await guardedResponse(signal, () => config.fetch(config.tokenEndpoint, { method: 'POST', redirect: 'manual', signal, headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, body: new URLSearchParams({ ...fields, client_id: config.clientId, resource: config.resource }) }));
    await rejectProviderRedirect(result);
    const body = await limitedJson(result, signal);
    if (!result.ok) {
      if ([400, 401].includes(result.status) && ['invalid_grant', 'invalid_client', 'invalid_scope', 'invalid_target'].includes(body?.error)) return null;
      fail('provider_unavailable');
    }
    const refresh = body.refresh_token ?? priorRefresh;
    if (!token(body.access_token) || !token(refresh) || typeof body.token_type !== 'string' || body.token_type.toLowerCase() !== 'bearer' || !Number.isFinite(body.expires_in) || body.expires_in <= 0 || body.expires_in > 86_400) fail('provider_response_invalid');
    const scopes = typeof body.scope === 'string' ? body.scope.split(/\s+/u).filter(Boolean).sort() : null;
    if (!scopes || scopes.join(' ') !== config.scopes.join(' ')) fail('provider_response_invalid');
    return { v: 1, a: body.access_token, r: refresh };
  }

  return Object.freeze({
    routes: Object.freeze({ launchPath: config.launchPath, callbackPath: config.callbackPath }),

    /** Always starts PKCE, even if an app session exists. Use this registered CW entrypoint. */
    async launch(request, returnPath = config.allowedReturnPaths[0]) {
      try {
        assertRequest(request, config);
        if (request.method !== 'GET' || new URL(request.url).pathname !== config.launchPath) return response(405, 'method_not_allowed');
        const approved = exactPath(returnPath, config.appOrigin);
        if (!config.allowedReturnPaths.includes(approved)) fail('return_path_invalid');
        const state = random(config), verifier = random(config);
        const challenge = bytes64(new Uint8Array(await config.crypto.subtle.digest('SHA-256', encoder.encode(verifier))));
        const target = new URL(config.authorizationEndpoint);
        for (const [name, value] of Object.entries({ response_type: 'code', client_id: config.clientId, redirect_uri: config.appOrigin + config.callbackPath, scope: config.scopes.join(' '), resource: config.resource, state, code_challenge: challenge, code_challenge_method: 'S256' })) target.searchParams.set(name, value);
        const flow = { v: 1, s: state, p: verifier, r: approved, t: config.now() };
        return response(303, '', [setCookie(SESSION_COOKIE, '', 0), setCookie(FLOW_COOKIE, object64(flow), FLOW_SECONDS)], target.href);
      } catch { return response(400, 'sign_in_failed'); }
    },

    async callback(request) {
      try {
        assertRequest(request, config);
        const url = new URL(request.url);
        if (request.method !== 'GET' || url.pathname !== config.callbackPath) return response(405, 'method_not_allowed');
        const value = cookies(request).get(FLOW_COOKIE);
        if (!value) return response(400, 'sign_in_failed');
        const flow = read64(value);
        const age = config.now() - flow?.t;
        if (flow?.v !== 1 || !Number.isFinite(age) || age < -30_000 || age > FLOW_SECONDS * 1_000 || !/^[A-Za-z0-9_-]{43}$/u.test(flow.s) || !/^[A-Za-z0-9_-]{43}$/u.test(flow.p) || url.searchParams.getAll('state').length !== 1 || url.searchParams.get('state') !== flow.s || !config.allowedReturnPaths.includes(flow.r) || url.searchParams.get('error') || url.searchParams.getAll('code').length !== 1) return response(400, 'sign_in_failed', [setCookie(FLOW_COOKIE, '', 0)]);
        const code = url.searchParams.get('code');
        if (!code || code.length > 2_048 || /[\u0000-\u0020]/u.test(code)) return response(400, 'sign_in_failed', [setCookie(FLOW_COOKIE, '', 0)]);
        return await bounded(config, async signal => {
          const next = await exchange({ grant_type: 'authorization_code', code, code_verifier: flow.p, redirect_uri: config.appOrigin + config.callbackPath }, signal);
          if (!next) return response(401, 'sign_in_failed', [setCookie(FLOW_COOKIE, '', 0), setCookie(SESSION_COOKIE, '', 0)]);
          return response(303, '', [setCookie(FLOW_COOKIE, '', 0), sessionLine(next)], new URL(flow.r, config.appOrigin).href);
        });
      } catch (error) { return safeFailure(error); }
    },

    /** Server-only callback makes the app's explicit authorized API request. No generic proxy. */
    async withAccessToken(request, useToken) {
      try {
        assertRequest(request, config);
        if (typeof useToken !== 'function') fail('handler_required');
        if (!['GET', 'HEAD'].includes(request.method)) assertMutationOrigin(request, config);
        const current = session(request);
        if (!current) return denied();
        return await bounded(config, async signal => {
          const first = await guardedResponse(signal, () => useToken(current.a, signal), 'response_required');
          if (first.status !== 401) return noStore(first);
          await first.body?.cancel();
          const next = await bounded(config, refreshSignal => exchange({ grant_type: 'refresh_token', refresh_token: current.r }, refreshSignal, current.r), signal);
          assertActive(signal);
          if (!next) return denied();
          const retried = await guardedResponse(signal, () => useToken(next.a, signal), 'response_required');
          if (retried.status === 401) { await retried.body?.cancel(); return denied(); }
          return noStore(retried, [sessionLine(next)]);
        }, request.signal, config.operationTimeout);
      } catch (error) { return safeFailure(error); }
    },

    /** Provider must revoke the entire app grant/family, including in-flight successors. */
    async logout(request) {
      try {
        assertRequest(request, config);
        assertMutationOrigin(request, config);
        if (request.method !== 'POST') return response(405, 'method_not_allowed');
        const current = session(request);
        if (!current) return response(204, '', [setCookie(SESSION_COOKIE, '', 0), setCookie(FLOW_COOKIE, '', 0)]);
        return await bounded(config, async signal => {
          const revoked = await guardedResponse(signal, () => config.fetch(config.revocationEndpoint, { method: 'POST', redirect: 'manual', signal, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, token: current.r, token_type_hint: 'refresh_token' }) }));
          await rejectProviderRedirect(revoked);
          await revoked.body?.cancel();
          if (!revoked.ok) fail('provider_unavailable');
          return response(204, '', [setCookie(SESSION_COOKIE, '', 0), setCookie(FLOW_COOKIE, '', 0)]);
        });
      } catch (error) { return safeFailure(error); }
    },
  });
}
