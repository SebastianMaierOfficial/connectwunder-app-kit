/** Pure setup validation and registration-result mapping. Performs no network or mutation. */
const manifestKeys = new Set(['name', 'description', 'mode', 'origin', 'entryPath', 'callbackUrl', 'boardIds', 'visibility', 'allowedUserIds']);
const text = (value, max, required = true) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f]/u.test(value) || (required && !value.trim())) throw new TypeError('Manifest text is invalid');
  return value.trim();
};
const ids = (value, max) => {
  if (!Array.isArray(value) || value.length > max || value.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/u.test(id)) || new Set(value).size !== value.length) throw new TypeError('Manifest identifiers are invalid');
  return [...value].sort();
};
function originOf(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new TypeError('An exact HTTPS origin is required');
  return url.origin;
}
export function validateApplicationManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !manifestKeys.has(key))) throw new TypeError('Manifest keys are invalid');
  if (!['managed', 'external'].includes(value.mode)) throw new TypeError('Application mode is invalid');
  const origin = originOf(value.origin);
  const entryPath = value.entryPath ?? (value.mode === 'managed' ? '/auth/connectwunder/launch' : '/');
  if (typeof entryPath !== 'string' || entryPath.length > 512 || !entryPath.startsWith('/') || entryPath.startsWith('//') || /[\\\s?#]/u.test(entryPath) || /%(?:2f|5c|00|0a|0d)/iu.test(entryPath) || new URL(entryPath, origin).origin !== origin) throw new TypeError('Application entry path is invalid');
  const boardIds = ids(value.boardIds ?? [], 100);
  const allowedUserIds = ids(value.allowedUserIds ?? [], 200);
  const visibility = value.visibility ?? 'workspace';
  if (!['workspace', 'selected'].includes(visibility) || (visibility === 'workspace' && allowedUserIds.length) || (visibility === 'selected' && !allowedUserIds.length)) throw new TypeError('Application audience is invalid');
  let callbackUrl = null;
  if (value.mode === 'managed') {
    const callback = new URL(value.callbackUrl ?? origin + '/auth/connectwunder/callback');
    if (callback.origin !== origin || callback.username || callback.password || callback.pathname === '/' || callback.search || callback.hash || callback.pathname === entryPath) throw new TypeError('Application callback is invalid');
    callbackUrl = callback.href;
  } else if (boardIds.length || value.callbackUrl) throw new TypeError('External links cannot request managed board access or callbacks');
  return { name: text(value.name, 100), description: text(value.description ?? '', 500, false), mode: value.mode, origin, entryPath, callbackUrl, boardIds, visibility, allowedUserIds };
}

/** Use only an authoritative successful registration response, never caller identity hints. */
export function configurationFromRegistration(registration, manifestValue, metadata) {
  const manifest = validateApplicationManifest(manifestValue);
  const app = registration?.application, oauth = registration?.oauth;
  if (manifest.mode !== 'managed' || app?.mode !== 'managed' || app.origin !== manifest.origin || !oauth) throw new TypeError('Managed registration result is required');
  const issuer = originOf(oauth.issuer);
  const resource = new URL(oauth.resource);
  if (resource.protocol !== 'https:' || resource.username || resource.password || resource.pathname !== '/api/workspace-apps/v1' || resource.search || resource.hash) throw new TypeError('Registration resource is invalid');
  if (oauth.redirectUri !== manifest.callbackUrl || typeof oauth.clientId !== 'string' || !/^[A-Za-z0-9_-]{8,160}$/u.test(oauth.clientId)) throw new TypeError('Registration binding is invalid');
  const expected = ['apps.identity.read', 'apps.navigation.read', ...(manifest.boardIds.length ? ['apps.boards.read'] : [])].sort();
  if (!Array.isArray(oauth.scopes) || [...oauth.scopes].sort().join(' ') !== expected.join(' ')) throw new TypeError('Registration scopes differ from the requested access');
  if (metadata?.issuer !== issuer) throw new TypeError('OAuth discovery metadata must match the registered issuer');
  const endpoint = key => {
    const url = new URL(metadata[key]);
    if (url.protocol !== 'https:' || url.origin !== issuer || url.username || url.password || url.search || url.hash) throw new TypeError('OAuth endpoint differs from the registered issuer');
    return url.href;
  };
  return { appOrigin: manifest.origin, issuer, resource: resource.href, clientId: oauth.clientId, authorizationEndpoint: endpoint('authorization_endpoint'), tokenEndpoint: endpoint('token_endpoint'), revocationEndpoint: endpoint('revocation_endpoint'), scopes: [...oauth.scopes], launchPath: manifest.entryPath, callbackPath: new URL(oauth.redirectUri).pathname, allowedReturnPaths: ['/'] };
}
