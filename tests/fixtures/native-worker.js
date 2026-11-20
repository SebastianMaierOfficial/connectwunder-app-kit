/** Native HTTP transport regression: deliberately no injected fetch or provider Response stub. */
import { createWorkspaceAppAuth, SESSION_COOKIE, FLOW_COOKIE } from '../../src/auth.js';
const scopes = ['apps.identity.read', 'apps.navigation.read'];
function cookie(result, name) {
  const lines = result.headers.getSetCookie?.() || (result.headers.get('set-cookie') || '').split(/,(?=\s*__Host-)/u);
  return lines.map(line => line.trim().split(';')[0]).find(line => line.startsWith(name + '='));
}
function request(origin, path, value, options = {}) {
  return new Request(origin + path, { ...options, headers: { ...(value ? { cookie: value } : {}), ...(options.headers || {}) } });
}
function require(value, code) { if (!value) throw new Error(code); }
function authFor(origin, provider, variant = '', explicitGlobalAlias = false) {
  return createWorkspaceAppAuth({ appOrigin: origin, issuer: provider, resource: provider + '/api/workspace-apps/v1',
    clientId: 'cw_wa_beta_synthetic_native', scopes, allowLocalhost: true,
    ...(explicitGlobalAlias ? { fetch: globalThis.fetch } : {}),
    authorizationEndpoint: provider + '/oauth/authorize', tokenEndpoint: provider + variant + '/oauth/token',
    revocationEndpoint: provider + variant + '/oauth/revoke' });
}
async function login(auth, origin) {
  const launch = await auth.launch(request(origin, '/auth/connectwunder/launch'));
  require(launch.status === 303, 'launch_failed');
  const state = new URL(launch.headers.get('location')).searchParams.get('state');
  return auth.callback(request(origin, '/auth/connectwunder/callback?code=synthetic-native-code&state=' + state, cookie(launch, FLOW_COOKIE)));
}
async function read(provider, accessToken, signal, path = '/identity') {
  const result = await fetch(provider + path, { redirect: 'manual', signal, headers: { authorization: 'Bearer ' + accessToken } });
  if (result.status >= 300 && result.status < 400) { await result.body?.cancel(); throw new Error('provider_redirect_denied'); }
  return result;
}
async function expire(provider) {
  const response = await fetch(provider + '/fixture/expire', { method: 'POST', redirect: 'manual' });
  require(response.status === 204, 'expire_failed');
}
async function qualify(origin, provider) {
  const auth = authFor(origin, provider), checks = {};
  const callback = await login(auth, origin);
  checks.nativeCallback = callback.status === 303 && !!cookie(callback, SESSION_COOKIE);
  require(checks.nativeCallback, 'native_callback_failed');
  const firstSession = cookie(callback, SESSION_COOKIE);
  const identity = await auth.withAccessToken(request(origin, '/', firstSession), (token, signal) => read(provider, token, signal));
  checks.nativeRead = identity.status === 200 && (await identity.json()).workspace === 'synthetic-workspace';
  const candidateRead = await auth.withCandidateAccessTokenOnce(request(origin, '/', firstSession), (token, signal) => read(provider, token, signal));
  checks.nativeCandidateRead = candidateRead.status === 200 && !candidateRead.headers.has('set-cookie');
  await candidateRead.body?.cancel();
  const beforeOnce = await (await fetch(provider + '/fixture/counters', {redirect:'manual'})).json();
  const lostOnce = await auth.withCandidateAccessTokenOnce(request(origin, '/', firstSession), (token, signal) => fetch(provider + '/fixture/candidate-lost', {method:'POST',redirect:'manual',signal,headers:{authorization:'Bearer '+token}}));
  checks.nativeCandidateLostReply = lostOnce.status === 503 && !lostOnce.headers.has('set-cookie');
  await expire(provider);
  const candidateDenied = await auth.withCandidateAccessTokenOnce(request(origin, '/', firstSession), (token, signal) => read(provider, token, signal));
  const afterOnce = await (await fetch(provider + '/fixture/counters', {redirect:'manual'})).json();
  checks.nativeCandidateNeverRetries = candidateDenied.status === 401 && !candidateDenied.headers.has('set-cookie') && afterOnce.refreshes === beforeOnce.refreshes && afterOnce.lostRequests === beforeOnce.lostRequests + 1;
  const refreshed = await auth.withAccessToken(request(origin, '/', firstSession), (token, signal) => read(provider, token, signal));
  checks.nativeRefresh = refreshed.status === 200 && !!cookie(refreshed, SESSION_COOKIE);
  await refreshed.body?.cancel();
  const refreshedSession = cookie(refreshed, SESSION_COOKIE);
  const logout = await auth.logout(request(origin, '/logout', refreshedSession, { method: 'POST', headers: { origin } }));
  checks.nativeRevoke = logout.status === 204 && cookie(logout, SESSION_COOKIE)?.endsWith('=');
  const restored = await auth.withAccessToken(request(origin, '/', refreshedSession), (token, signal) => read(provider, token, signal));
  checks.revokedAccessDenied = restored.status === 401;

  const explicit = authFor(origin, provider, '', true);
  const explicitCallback = await login(explicit, origin);
  checks.nativeExplicitAliasCallback = explicitCallback.status === 303 && !!cookie(explicitCallback, SESSION_COOKIE);
  require(checks.nativeExplicitAliasCallback, 'native_explicit_alias_callback_failed');
  await expire(provider);
  const explicitRefresh = await explicit.withAccessToken(request(origin, '/', cookie(explicitCallback, SESSION_COOKIE)), (token, signal) => read(provider, token, signal));
  checks.nativeExplicitAliasRefresh = explicitRefresh.status === 200 && !!cookie(explicitRefresh, SESSION_COOKIE);
  await explicitRefresh.body?.cancel();
  const explicitRevoke = await explicit.logout(request(origin, '/logout', cookie(explicitRefresh, SESSION_COOKIE), { method: 'POST', headers: { origin } }));
  checks.nativeExplicitAliasRevoke = explicitRevoke.status === 204;

  let redirectCases = 0;
  for (const status of [300, 301, 302, 303, 304, 305, 307, 308, 399]) {
    const blocked = authFor(origin, provider, '/redirect/' + status);
    const deniedCallback = await login(blocked, origin);
    require(deniedCallback.status === 503 && !deniedCallback.headers.has('set-cookie'), 'callback_redirect_not_rejected');
    const good = await login(auth, origin), value = cookie(good, SESSION_COOKIE);
    await expire(provider);
    const deniedRefresh = await blocked.withAccessToken(request(origin, '/', value), (token, signal) => read(provider, token, signal));
    require(deniedRefresh.status === 503 && !deniedRefresh.headers.has('set-cookie'), 'refresh_redirect_not_rejected');
    const deniedRevoke = await blocked.logout(request(origin, '/logout', value, { method: 'POST', headers: { origin } }));
    require(deniedRevoke.status === 503 && !deniedRevoke.headers.has('set-cookie'), 'revoke_redirect_not_rejected');
    const readGood = await login(auth, origin);
    const deniedRead = await auth.withAccessToken(request(origin, '/', cookie(readGood, SESSION_COOKIE)), (token, signal) => read(provider, token, signal, '/redirect/' + status + '/identity'));
    require(deniedRead.status === 503, 'read_redirect_not_rejected');
    redirectCases += 4;
  }
  checks.nativeRedirectsRejected = redirectCases === 36;
  let unsupportedErrorModeRejected = false;
  try { const result = await fetch(provider + '/fixture/unsupported-error', { redirect: 'error' }); await result.body?.cancel(); } catch { unsupportedErrorModeRejected = true; }
  return { status: Object.values(checks).every(Boolean) ? 'pass' : 'fail', checks, redirectCases, unsupportedErrorModeRejected,
    providerTransport: 'native-workerd-global-fetch-over-loopback-http', injectedProviderFetch: false };
}
async function nativeTransportProbe(provider) {
  const facts = {};
  const detachedReceiver = { fetch: globalThis.fetch };
  const detachedFunction = globalThis.fetch;
  const boundFunction = globalThis.fetch.bind(globalThis);
  for (const [name, operation] of [
    ['globalReceiver', () => globalThis.fetch(provider + '/fixture/probe', { redirect: 'manual' })],
    ['detachedFunction', () => detachedFunction(provider + '/fixture/probe', { redirect: 'manual' })],
    ['configReceiver', () => detachedReceiver.fetch(provider + '/fixture/probe', { redirect: 'manual' })],
    ['boundFunction', () => boundFunction(provider + '/fixture/probe', { redirect: 'manual' })],
  ]) {
    try { const result = await operation(); facts[name] = { status: result.status }; await result.body?.cancel(); }
    catch (error) { facts[name] = { errorName: error.name === 'TypeError' ? 'TypeError' : 'Error', illegalInvocation: /illegal invocation|incorrect.*this/iu.test(error.message) }; }
  }
  return facts;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return new Response(null, { status: 404 });
    if (url.pathname === '/health') return new Response('ready');
    if (url.pathname !== '/qualify') return new Response(null, { status: 404 });
    const origin = 'http://localhost:' + url.port;
    const transportProbe = await nativeTransportProbe(env.PROVIDER_ORIGIN);
    try { return Response.json({ ...await qualify(origin, env.PROVIDER_ORIGIN), transportProbe }); }
    catch (error) { return Response.json({ status: 'fail', code: ['launch_failed', 'native_callback_failed', 'callback_redirect_not_rejected', 'refresh_redirect_not_rejected', 'revoke_redirect_not_rejected', 'read_redirect_not_rejected'].includes(error.message) ? error.message : 'native_network_qualification_failed', transportProbe }, { status: 500 }); }
  },
};
