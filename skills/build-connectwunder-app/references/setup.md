# Setup

Begin with the user's result and their selected workspace. Use the existing
ConnectWunder connector for the correct environment; complete its normal OAuth
sign-in if necessary. An agent that has no connector may use the supported
owner/admin UI and official API documentation. Do not bypass missing tools with
direct database writes or invent a registration endpoint or tool name.

Before registration, identify the existing services needed by the application.
ConnectWunder supplies workspace identity/membership, app registration and
supported board data. The application can own its presentation, layout and
additional domain state that the provider does not supply. Do not make the user
create another account just to use their ConnectWunder workspace application.

An owner/admin prepares the actual app name, exact HTTPS origin, registered
launch/callback paths, approved return entrypoints, selected boards and intended
audience. The current user explicitly approves the requested access. Registration
must not create background permissions or public data publication.

Record the returned app/client identifiers and authoritative issuer, resource,
OAuth endpoints and scopes. These are configuration, not guessed from a display
name or a Site URL. Keep one environment throughout setup. An unknown write
outcome requires a status check using the original idempotency key before retry.

A builder's connector authorization is for setup only. Configure the application's
own registered public PKCE client. Never reuse a personal API key, a shared admin
key or the builder's access/refresh tokens inside the application.

Use the hosting platform's protected runtime configuration for live values. This
kit's helper requires no client secret or encryption key. A Sites visitor login
may remain an additional gate; inspect it explicitly rather than changing the
Site audience to remove an obstacle.

The helper's default routes are `/auth/connectwunder/launch` and
`/auth/connectwunder/callback`. Register those exact paths, or configure the helper
and registration together. ConnectWunder must launch the first route, never the
ordinary app home, so that a stale session for another user cannot be reused.

## Discover the target's workspace-app contract

After the registrar returns the managed app's `oauth.resource`, use that exact
resource URL (path `/api/workspace-apps/v1`) for:

- `GET <resource>/contract`: official Workspace Apps v1 discovery, including the
  target issuer, resource, scopes, endpoints and `endpoints.openapi` URL.
- `GET <resource>/openapi`: the full official OpenAPI schemas.

Both endpoints require no authentication and contain static contract/configuration
only, with no registered app, user or workspace data. Confirm the discovery
resource and issuer match registration before using the advertised endpoints.
Read [data](data.md) for the supported response versions and live-target check.

The general API reference at https://app.connectwunder.com/docs/api and its
`/openapi.yaml` are separate from this workspace-app specification. Absence of
workspace-app routes there does not establish incompatibility. If the confirmed
registrar resource's `/contract` or `/openapi` returns 404, stop with a precise
feature-not-deployed blocker containing the target URL and HTTP status. Report
missing registration or scoped-board capability specifically; never guess a
replacement endpoint or substitute broad MCP/Connected Apps worker scopes.

## Local planning helper

Write the reviewed manifest in the application's ignored `.local/` folder.
The shape is `name`, optional `description`, `mode: "managed"`, exact `origin`,
optional `entryPath`/`callbackUrl`, selected `boardIds`, optional `boardWriteGrants`, `visibility` and
`allowedUserIds`. Workspace visibility requires no user list; selected visibility
requires explicit active human IDs. An external navigation-only link uses
`mode: "external"` and cannot request managed boards or an OAuth callback.

Run `node scripts/setup.mjs check manifest.json`, then
`node scripts/setup.mjs plan manifest.json --out .local/registration-plan.json`.
The saved plan contains the actual supported MCP `register_application`
arguments and a stable operation key. The agent calls that tool through the
connected human workspace session. Repeating plan reuses the same operation key;
a changed manifest requires reconciliation, not blind creation.

Use `list_applications` to inspect existing records, `update_application` with
its expected revision for deliberate changes, and `get_application_entrypoint`
for the approved launch. The domain verifies Owner/Admin authority. An apps.*
runtime token cannot register itself. The local helper does not request or save
a raw Firebase token and does not perform an independent registration mutation.

Save the tool's successful response and retrieve the registered issuer's public
OAuth discovery metadata. Then run:

```sh
node scripts/setup.mjs configure .local/registration-result.json \
  --manifest manifest.json --metadata .local/oauth-discovery.json \
  --out .local/application-config.json
```

This copies only the confirmed public-client configuration. It rejects mismatched
origins, scopes, callbacks or discovery endpoints, and never overwrites a different
existing configuration. Move the resulting values to the host's protected runtime
configuration. Do not commit workspace-specific setup files or tokens.

## Optional board write access

Read-only registrations keep their existing shape and scopes. Request writes only
when the user's workflow needs them and the live target's discovery/OpenAPI
advertises the exact actions. An older target is a feature-not-deployed blocker;
never substitute `mcp.full`, an API key or another user's token.

`boardWriteGrants` is an explicit list of selected-board constraints. Each entry
contains `boardId` and `actions`, chosen from `items.create`, `items.fields.write`
and `notes.create`. It may not refer to a board outside `boardIds`. Creation must
name `createColumnIds` and `createFieldKeys` (an empty field list deliberately
allows no custom fields). Field editing must name nonempty `updateFieldKeys`.
Constraints for unrequested actions are rejected. A reference-only board receives
no write grant. The agent resolves real column/field identifiers from authorized
metadata; users should review readable board names and actions, not type IDs.

The owner/admin approves registration; the current user separately consents to
the requested access. Scope and live board action grant and current user rights
are all required. No write permission is inferred from workspace ownership or
from a read grant. Registration changes can require new user consent.

Use stable intent/mutation keys for retries. External app writes retain the
provider's existing API credit policy, including 4 credits for successful creation;
an exact replay must not create or charge a second operation. Other write pricing
and detailed request/precondition formats come from the target contract.
