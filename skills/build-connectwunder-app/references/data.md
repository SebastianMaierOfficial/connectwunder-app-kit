# Data

Use direct, explicit HTTP requests from your app's server. There is no required
API client SDK. Use the app's own public-PKCE authorization and the canonical
`/api/workspace-apps/v1` resource. Fetch with a bounded timeout and reject redirects
rather than forwarding an Authorization header to another origin.

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

This version has read scopes only. Do not implement board mutations by borrowing
a builder/admin token. Ask for the supported, separately authorized provider
command when the requested workflow needs writes. Extra application-owned data
is not an excuse to duplicate provider-owned identity or workspace permissions.
