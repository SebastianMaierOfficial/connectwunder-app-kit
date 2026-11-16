/** Synthetic loopback-only test harness. Not an application starter or dashboard. */
import { createWorkspaceAppAuth, SESSION_COOKIE, FLOW_COOKIE } from '../../src/auth.js';
import navigationSource from '../../navigation-source';
import navigationCss from '../../navigation-css';
let sequence = 0;
let accessExpired = false;
let policyActive = true;
const access = new Map(), refresh = new Map(), revoked = new Set();
const scopes = ['apps.identity.read', 'apps.navigation.read'];
function pair(family = 'synthetic-family') {
  const value = { a: `cw_at_fixture_${++sequence}_synthetic_only`, r: `cw_rt_fixture_${sequence}_synthetic_only`, family };
  access.set(value.a, value);
  refresh.set(value.r, value);
  return value;
}
function cookieLines(result) { return result.headers.getSetCookie?.() || (result.headers.get('set-cookie') || '').split(/,(?=\s*__Host-)/u); }
function cookie(result, name) { return cookieLines(result).map(line => line.trim().split(';')[0]).find(line => line.startsWith(name + '=')); }
function unpack(cookie) { return JSON.parse(atob(cookie.slice(cookie.indexOf('=') + 1).replaceAll('-', '+').replaceAll('_', '/'))); }
function authFor(origin) {
  return createWorkspaceAppAuth({
    appOrigin: origin, issuer: origin, resource: origin + '/api/workspace-apps/v1',
    clientId: 'cw_wa_beta_synthetic_worker', scopes, allowLocalhost: true,
    authorizationEndpoint: origin + '/provider/authorize', tokenEndpoint: origin + '/provider/token', revocationEndpoint: origin + '/provider/revoke',
    fetch: async (url, options) => {
      const form = new URLSearchParams(options.body);
      if (url.endsWith('/provider/revoke')) {
        const current = refresh.get(form.get('token'));
        if (current) revoked.add(current.family);
        return new Response(null, { status: 200 });
      }
      if (!policyActive) return Response.json({ error: 'invalid_grant' }, { status: 400 });
      let result;
      if (form.get('grant_type') === 'authorization_code') result = pair('synthetic-family-' + sequence);
      else {
        const old = refresh.get(form.get('refresh_token'));
        if (!old || revoked.has(old.family)) return Response.json({ error: 'invalid_grant' }, { status: 400 });
        result = old.next || (old.next = pair(old.family));
        accessExpired = false;
      }
      return Response.json({ access_token: result.a, refresh_token: result.r, token_type: 'Bearer', expires_in: 900, scope: scopes.join(' ') });
    },
  });
}
async function useToken(token) {
  const current = access.get(token);
  if (!current || accessExpired || !policyActive || revoked.has(current.family)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({ principal: 'synthetic-user', workspace: 'synthetic-workspace' });
}
function harnessHtml(origin) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>App Kit runtime check</title><style>body{font:16px/1.5 Arial,sans-serif;margin:0;color:#0f172a;background:#fff}.layout{display:grid;grid-template-columns:260px minmax(0,1fr);gap:32px;padding:24px;max-width:1100px;margin:auto}main{min-width:0}h1{font-size:28px;margin:0 0 16px}button,a.action{display:inline-block;font:inherit;padding:10px 14px;margin:0 8px 12px 0;color:#312e81;background:#eef2ff;border:1px solid #a5b4fc;border-radius:6px}output{display:block;padding:16px 0;overflow-wrap:anywhere}button:focus-visible,a:focus-visible{outline:2px solid #4f46e5;outline-offset:3px}@media(max-width:640px){.layout{grid-template-columns:1fr;padding:16px;gap:24px}}</style><div class="layout"><connectwunder-nav></connectwunder-nav><main><h1>App Kit runtime check</h1><p>This local fixture checks the helper and navigation. It contains only synthetic data.</p><a class="action" href="/auth/connectwunder/launch">Connect sample workspace</a><button id="read">Check protected read</button><button id="parallel">Check parallel refresh</button><button id="revoke">Check revoked access</button><output aria-live="polite" id="result">Ready</output></main></div><script type="module">import {defineConnectWunderNavigation} from '/src/navigation.js';defineConnectWunderNavigation();const nav=document.querySelector('connectwunder-nav');nav.allowedOrigins=[location.origin,'https://example.invalid'];nav.model={workspaceName:'Sample workspace',homeHref:'/',homeLabel:'Return to sample workspace',items:[{id:'fixture',label:'Runtime checks',href:'/',current:true},{id:'long',label:'A longer navigation label that remains readable on a narrow screen',href:'/'}],legal:{imprint:'https://example.invalid/imprint',privacy:'https://example.invalid/privacy'}};const output=document.querySelector('#result');async function read(){const r=await fetch('/api/identity');return {status:r.status,body:await r.json()}}document.querySelector('#read').onclick=async()=>{output.textContent=JSON.stringify(await read())};document.querySelector('#parallel').onclick=async()=>{await fetch('/fixture/expire',{method:'POST'});output.textContent=JSON.stringify(await Promise.all([read(),read()]))};document.querySelector('#revoke').onclick=async()=>{await fetch('/fixture/revoke',{method:'POST'});output.textContent=JSON.stringify(await read())};</script></html>`;
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return new Response(null, { status: 404 });
    // The helper uses an explicitly configured localhost test origin, never a production host hint.
    const origin = 'http://localhost:' + url.port;
    const localRequest = new Request(origin + url.pathname + url.search, request);
    const auth = authFor(origin);
    if (url.pathname === '/src/navigation.js') return new Response(navigationSource, { headers: { 'content-type': 'text/javascript' } });
    if (url.pathname === '/src/navigation.css') return new Response(navigationCss, { headers: { 'content-type': 'text/css' } });
    if (url.pathname === '/') return new Response(harnessHtml(origin), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (url.pathname === auth.routes.launchPath) return auth.launch(localRequest);
    if (url.pathname === auth.routes.callbackPath) return auth.callback(localRequest);
    if (url.pathname === '/provider/authorize') {
      const target = new URL(url.searchParams.get('redirect_uri'));
      if (target.origin !== origin || target.pathname !== auth.routes.callbackPath) return new Response(null, { status: 400 });
      target.searchParams.set('state', url.searchParams.get('state'));
      target.searchParams.set('code', 'synthetic-authorization-code');
      return new Response(null, { status: 303, headers: { location: target.href } });
    }
    if (url.pathname === '/api/identity') return auth.withAccessToken(localRequest, useToken);
    if (url.pathname === '/fixture/expire' && request.method === 'POST') { accessExpired = true; return new Response(null, { status: 204 }); }
    if (url.pathname === '/fixture/revoke' && request.method === 'POST') { policyActive = false; return new Response(null, { status: 204 }); }
    if (url.pathname === '/qualify') {
      policyActive = true;
      accessExpired = false;
      const first = await auth.launch(new Request(origin + auth.routes.launchPath));
      const target = new URL(first.headers.get('location'));
      const complete = await auth.callback(new Request(origin + auth.routes.callbackPath + '?' + new URLSearchParams({ code: 'synthetic', state: target.searchParams.get('state') }), { headers: { cookie: cookie(first, FLOW_COOKIE) } }));
      const session = cookie(complete, SESSION_COOKIE);
      const authorized = await auth.withAccessToken(new Request(origin + '/api/identity', { headers: { cookie: session } }), useToken);
      accessExpired = true;
      const parallel = await Promise.all([1, 2].map(() => auth.withAccessToken(new Request(origin + '/api/identity', { headers: { cookie: session } }), useToken)));
      const refreshTokens = parallel.map(result => cookie(result, SESSION_COOKIE)).filter(Boolean).map(value => unpack(value).r);
      policyActive = false;
      const rejected = await auth.withAccessToken(new Request(origin + '/api/identity', { headers: { cookie: cookie(parallel[0], SESSION_COOKIE) || session } }), useToken);
      policyActive = true;
      const checks = { pkceCallback: first.status === 303 && complete.status === 303, protectedRead: authorized.status === 200, parallelRefresh: parallel.every(result => result.status === 200), sameRefreshSuccessor: refreshTokens.length === 2 && refreshTokens[0] === refreshTokens[1], noStore: parallel.every(result => result.headers.get('cache-control') === 'no-store'), rejectedPolicy: rejected.status === 401 && !rejected.headers.has('location'), secureHttpOnlyCookie: cookieLines(complete).some(line => line.startsWith(SESSION_COOKIE + '=') && line.includes('Secure; HttpOnly; SameSite=Lax')) };
      return Response.json({ status: Object.values(checks).every(Boolean) ? 'pass' : 'fail', runtime: 'workerd', nodeCompatibility: false, syntheticProvider: true, providerTransport: 'injected-in-process-fetch-stub', nativeProviderNetwork: false, checks });
    }
    return new Response(null, { status: 404 });
  },
};
