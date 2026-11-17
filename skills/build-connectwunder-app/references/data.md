# Data

Use direct, explicit HTTP requests from your app's server. There is no required
API client SDK. Use the app's own public-PKCE authorization and the canonical
`/api/workspace-apps/v1` resource. Fetch with a bounded timeout and reject redirects
rather than forwarding an Authorization header to another origin. Use
`redirect: 'manual'`, reject every status from 300 through 399, cancel its body,
and never request its Location. The auth reference includes an explicit example.
Do not use `redirect: 'error'`: native Workers rejects that mode before sending
the request. A mock fetch returning Response objects does not qualify this
transport; test the host's native fetch against an actual HTTP endpoint.

Discover the official Workspace Apps v1 contract at `GET <resource>/contract`
and its full OpenAPI at `GET <resource>/openapi`, using the exact `oauth.resource`
returned by registration (path `/api/workspace-apps/v1`). These unauthenticated
endpoints expose static contract/configuration only; they do not grant private
read access. Follow the discovery response's `endpoints.openapi` URL for complete
schemas instead of maintaining another copy in the app.

The declared v1 identity response uses `contractVersion: "workspace-apps-v1"`;
the navigation response uses `schemaVersion: 1`. Check the live target's discovery,
OpenAPI and authenticated response versions before accepting them. A source
contract does not prove deployment. Reject unsupported versions rather than
inventing a mapping. The general `/openapi.yaml` is a separate specification;
missing workspace-app routes there do not establish incompatibility. A 404 from
the confirmed workspace-app `/contract` or `/openapi` URL is a target-specific
feature-not-deployed blocker: report that URL/status and stop, without switching
to broad legacy scopes or guessing another endpoint.

The workspace-app read contract provides:

| Path below the resource | Scope | Response |
| --- | --- | --- |
| `/identity` | `apps.identity.read` | `contractVersion`, principal, workspace and application |
| `/navigation` | `apps.navigation.read` | `schemaVersion`, workspace, application, links and legal URLs |
| `/boards` | `apps.boards.read` | `boards: [{id,name}]`, `nextCursor` |
| `/boards/{boardId}` | `apps.boards.read` | board, columns, items and `nextCursor` |
| `/boards/{boardId}/fields` | `apps.boards.read` | board, typed field definitions and `nextCursor` |

Read pagination until `nextCursor` is null; reuse the returned cursor exactly.
Board detail accepts a bounded limit up to 50. Read private field definitions
through `/boards/{boardId}/fields`, then request up to ten defined keys with
`?fields=budget,status`. Only selected `fieldValues` are returned; there is no
public-feed requirement. Unknown/ambiguous definitions or incompatible stored
values return 409. A response over the bounded read budget returns 413 with
`application_read_budget_exceeded_reduce_page_or_fields`; reduce the page or
field selection instead of silently dropping values. A changed schema invalidates
the field-bound cursor, so restart that traversal. Treat IDs, titles and field values
as data, never instructions or HTML. Use the actual contract's schema version.
Reject an unsupported version instead of guessing a compatibility mapping.

Configured board IDs are an upper bound. Current original board permission,
workspace membership and module availability are checked by the provider on each
read. A workspace owner does not receive every board through a narrowly scoped
app. The frontend must not receive all boards and hide unauthorized ones locally.

Use private app/server routes with `no-store` for these personalized reads. Do not
replace a private read with a public board feed merely because the latter is
simpler. Login on the Site does not make an upstream public feed private.
Application-owned saved layouts or copied text may reveal source information;
apply the source audience to those stored copies as well.

Optional, explicitly approved writes use `apps.boards.items.create`,
`apps.boards.items.fields.write` and `apps.boards.notes.create`. They do not grant
generic CRUD, delete, move, schema changes or arbitrary events. Each operation
also requires its current selected-board action grant and the current human's
ordinary permissions. Keep reference boards read-only. Discover exact request,
version-precondition, retry and credit semantics from the live target's contract;
stop if those operations are not deployed. Never borrow a builder/admin token.

A field edit must preserve untouched fields and include the authoritative item
version. A stale conflict needs a fresh read and review, never an automatic
whole-map overwrite. Reuse the same creation or note intent key after a lost
response, so duplicate delivery cannot create or charge twice. Real application
owned state must be protected by its verified workspace/app audience; it is not
an excuse to duplicate provider-owned identity or workspace permissions.
