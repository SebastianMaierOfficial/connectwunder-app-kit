# Server authentication

Import `createWorkspaceAppAuth` from `src/auth.js` (package export `./auth`).
The module uses Web Request/Response, fetch and Web Crypto. It contains no Node
imports, local key vault, framework dependency or mandatory session database.

Configure it on the server using the registration result:

```js
const auth = createWorkspaceAppAuth({
  appOrigin: configuration.appOrigin,
  issuer: configuration.issuer,
  resource: configuration.resource,
  clientId: configuration.clientId,
  authorizationEndpoint: configuration.authorizationEndpoint,
  tokenEndpoint: configuration.tokenEndpoint,
  revocationEndpoint: configuration.revocationEndpoint,
  scopes: configuration.scopes,
  launchPath: '/auth/connectwunder/launch',
  callbackPath: '/auth/connectwunder/callback',
  allowedReturnPaths: ['/'],
});
```

Resource is the canonical API origin plus `/api/workspace-apps/v1`. Request
`apps.identity.read`, with `apps.navigation.read` and `apps.boards.read` only as
needed. Do not mix legacy scopes. The helper checks endpoint origins against the
configured issuer. Do not configure endpoints from incoming query/header values.

Map the registered launch route to `auth.launch(request)`, and callback to
`auth.callback(request)`. Launch always starts a fresh S256/state flow and clears
the old local app cookie; remembered provider consent makes the normal return
smooth. The helper does not accept user IDs or bearer values in the launch URL.
Only a configured return-path allowlist is accepted. Direct app navigation can
use its existing app session; navigation from ConnectWunder must use launch.

## Document route errors

The helper returns framework-neutral transport responses. The application owns
the page shown when a top-level launch or callback request fails. Render a short,
readable explanation in the app's UI with an explicit manual retry action, a way
back to ConnectWunder and visible Imprint/Privacy links. Use reviewed configuration
or approved navigation links for those actions. Do not send raw helper JSON as the
browser's document, echo query values, state, codes, tokens or request/provider
URLs, or expose internal exception details.

When adapting an error response to HTML, preserve its original HTTP status and
security headers, including `no-store` and every separate `Set-Cookie` header and
cookie deletion. Update only representation headers as needed for the HTML body;
do not turn a 4xx/503 into a successful page status or lose cookie clears through
a lossy header copy. Keep successful redirect responses intact. Retry must require
an explicit user action; an immediate redirect back into login can create a loop.

Protected API errors remain structured JSON with their original status and
security behavior. Verify denied/expired callbacks and provider outages as actual
browser documents as well as API responses. No UI framework is required by this
adapter responsibility.

For a protected read, make the explicit API call in a server-only callback:

```js
return auth.withAccessToken(request, async (accessToken, signal) => {
  const result = await fetch(configuration.resource + '/identity', {
    headers: { authorization: 'Bearer ' + accessToken },
    redirect: 'manual',
    signal,
  });
  if (result.status >= 300 && result.status < 400) {
    await result.body?.cancel();
    throw new Error('provider_redirect_denied');
  }
  return result;
});
```

Use `redirect: 'manual'` and reject every 300–399 response before parsing or
returning it. Cancel its body and never fetch its Location. This works with
Workers' native fetch, which does not support `redirect: 'error'`; see the
[official Request contract](https://developers.cloudflare.com/workers/runtime-apis/request/).
Token, refresh and revoke requests in the helper use this same boundary. The
helper binds the native global fetch alias to its required global receiver; custom
or already-bound fetch functions keep their own semantics. If your server adapter
captures native fetch for its own requests, preserve that receiver too.

The callback must return a Response and honor the supplied AbortSignal. Never
serialize its token argument or add a general URL-accepting proxy. The helper
makes at most one refresh/retry after an upstream 401. Its entire request budget
is at most ten seconds. Responses are `no-store`; transient failures return 503
without deleting session cookies. Revoked/invalid refresh returns 401 without
an automatic redirect. Preserve unsaved work before offering a fresh launch.
For cookie-authenticated mutations, use the helper and require an exact Origin;
the helper rejects missing/foreign origins for non-read requests.

POST the local logout route to `auth.logout(request)` with the app's exact Origin.
The provider must revoke the complete app grant/family, including concurrent
successors; revoking one old refresh record is not sufficient. The helper clears
its local cookie after confirmed provider revocation. A failed revocation returns
503 so the UI does not falsely claim global logout.

## Cookie boundary

`__Host-cw_app_session` contains only opaque provider access/refresh tokens and a
format version. `__Host-cw_app_flow` contains short-lived random state, PKCE
verifier and an approved return path. Both use Secure, HttpOnly, Path=/ and
SameSite=Lax, without Domain. Lax permits the normal top-level OAuth callback;
exact Origin protection covers mutations. HTTPS is mandatory except an explicit
`allowLocalhost: true` test mode for `http://localhost`; cookies stay Secure.

There is intentionally no extra encryption key or copied server-side session
store. Token validity and current authority are decided by the provider, not
cookie metadata. Token cookies are not readable by ordinary page JavaScript,
but a stolen cookie is a bearer credential. Browser-profile theft, backend/header
logging or a compromised app operator can expose the raw tokens. Never log Cookie,
Set-Cookie, Authorization or token endpoint bodies. Encryption could conceal raw
tokens after a cookie-file leak, but would not prevent replay of that same cookie
to the app. This is an explicit tradeoff, not a claim that encryption is useless.

This public-PKCE server helper is not the confidential-client BFF model described
by RFC 10017. Do not promise complete protection from same-origin malicious code
or acquisition of new tokens. Prevent script injection and render untrusted data
as text. Provider scopes, exact client/resource and per-user board restrictions
remain essential limits on the effect of compromise.

The qualified provider contract permits only a short two-minute parallel refresh
replay window for these app clients. There is no twelve-hour stale-token promise.
Cookie responses can arrive out of order; test actual request timing and bounded
recovery. Long-stale/revoked sessions fail with a clean 401, not a loop.

References: [OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html),
[Browser application guidance](https://www.rfc-editor.org/rfc/rfc10017.html),
[cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

## Explicit write scopes

The helper accepts the three declared board write scopes in addition to the read
scopes. It never adds them to a configured read-only app. Use the exact scopes
confirmed by registration and target discovery; token and refresh responses must
match the configured set exactly. Broader MCP/Connected App profiles, an unknown
write name, a missing requested scope or an extra returned scope are rejected.
This client allowlist does not grant server permission; live user, app, board and
action checks remain mandatory on each provider mutation.
