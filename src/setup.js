/** Pure setup validation and registration-result mapping. Performs no network or mutation. */
const manifestKeys = new Set(['name', 'description', 'mode', 'origin', 'entryPath', 'callbackUrl', 'boardIds', 'boardWriteGrants', 'visibility', 'allowedUserIds']);
const text = (value, max, required = true) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f]/u.test(value) || (required && !value.trim())) throw new TypeError('Manifest text is invalid');
  return value.trim();
};
const ids = (value, max) => {
  if (!Array.isArray(value) || value.length > max || value.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/u.test(id)) || new Set(value).size !== value.length) throw new TypeError('Manifest identifiers are invalid');
  return [...value].sort();
};
const actionScopes = {
  'items.create': 'apps.boards.items.create',
  'items.fields.write': 'apps.boards.items.fields.write',
  'notes.create': 'apps.boards.notes.create',
};
function prepareWriteAccess(input, selectedBoards) {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 100) throw new TypeError('Board write grants are invalid');
  const seen = new Set();
  return input.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || Object.keys(entry).some(key => !['boardId', 'actions', 'createColumnIds', 'createFieldKeys', 'updateFieldKeys'].includes(key))
      || !selectedBoards.includes(entry.boardId) || seen.has(entry.boardId)) throw new TypeError('Board write grant is not selected or is duplicated');
    seen.add(entry.boardId);
    if (!Array.isArray(entry.actions) || entry.actions.length > 3 || entry.actions.some(action => typeof action !== 'string') || new Set(entry.actions).size !== entry.actions.length) throw new TypeError('Board write actions are invalid');
    const actions = [...entry.actions].sort();
    if (!actions.length || actions.some(action => !Object.hasOwn(actionScopes, action))) throw new TypeError('Board write action is invalid');
    const grant = { boardId: entry.boardId, actions };
    for (const [key, action, max, allowEmpty] of [
      ['createColumnIds', 'items.create', 100, false],
      ['createFieldKeys', 'items.create', 40, true],
      ['updateFieldKeys', 'items.fields.write', 30, false],
    ]) {
      if (!actions.includes(action)) {
        if (entry[key] !== undefined) throw new TypeError('Unrequested write constraints are invalid');
        continue;
      }
      const values = key === 'createColumnIds' ? ids(entry[key], max) : fieldNames(entry[key], max);
      if (!allowEmpty && values.length === 0) throw new TypeError('Write constraints must be explicit');
      grant[key] = values;
    }
    return grant;
  }).sort((a, b) => a.boardId.localeCompare(b.boardId));
}
function fieldNames(input, maximum) {
  if (!Array.isArray(input) || input.length > maximum || input.some(key => typeof key !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/u.test(key))
    || new Set(input).size !== input.length) throw new TypeError('Write field keys are invalid');
  return [...input].sort();
}
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
  const boardWriteGrants = prepareWriteAccess(value.boardWriteGrants, boardIds);
  const allowedUserIds = ids(value.allowedUserIds ?? [], 200);
  const visibility = value.visibility ?? 'workspace';
  if (!['workspace', 'selected'].includes(visibility) || (visibility === 'workspace' && allowedUserIds.length) || (visibility === 'selected' && !allowedUserIds.length)) throw new TypeError('Application audience is invalid');
  let callbackUrl = null;
  if (value.mode === 'managed') {
    const callback = new URL(value.callbackUrl ?? origin + '/auth/connectwunder/callback');
    if (callback.origin !== origin || callback.username || callback.password || callback.pathname === '/' || callback.search || callback.hash || callback.pathname === entryPath) throw new TypeError('Application callback is invalid');
    callbackUrl = callback.href;
  } else if (boardIds.length || boardWriteGrants.length || value.callbackUrl) throw new TypeError('External links cannot request managed board access or callbacks');
  return { name: text(value.name, 100), description: text(value.description ?? '', 500, false), mode: value.mode, origin, entryPath, callbackUrl, boardIds, ...(boardWriteGrants.length ? { boardWriteGrants } : {}), visibility, allowedUserIds };
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
  const requestedWrites = new Set((manifest.boardWriteGrants ?? []).flatMap(grant => grant.actions.map(action => actionScopes[action])));
  const expected = ['apps.identity.read', 'apps.navigation.read', ...(manifest.boardIds.length ? ['apps.boards.read'] : []), ...requestedWrites].sort();
  if (!Array.isArray(oauth.scopes) || [...oauth.scopes].sort().join(' ') !== expected.join(' ')) throw new TypeError('Registration scopes differ from the requested access');
  if (metadata?.issuer !== issuer) throw new TypeError('OAuth discovery metadata must match the registered issuer');
  const endpoint = key => {
    const url = new URL(metadata[key]);
    if (url.protocol !== 'https:' || url.origin !== issuer || url.username || url.password || url.search || url.hash) throw new TypeError('OAuth endpoint differs from the registered issuer');
    return url.href;
  };
  return { appOrigin: manifest.origin, issuer, resource: resource.href, clientId: oauth.clientId, authorizationEndpoint: endpoint('authorization_endpoint'), tokenEndpoint: endpoint('token_endpoint'), revocationEndpoint: endpoint('revocation_endpoint'), scopes: [...oauth.scopes], launchPath: manifest.entryPath, callbackPath: new URL(oauth.redirectUri).pathname, allowedReturnPaths: ['/'] };
}
