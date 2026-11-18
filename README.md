# ConnectWunder App Kit

Build a private application around your ConnectWunder workspace with an AI agent.
Keep your preferred frontend framework and hosting. Use ConnectWunder for the
workspace, access controls, supported data and the route back to your team.

Beta preview: the full shared sidebar and application access controls target
ConnectWunder Beta. Check the selected environment’s live contract before using
these capabilities; a Beta release does not enable them in Production.

Start your AI in this repository, or give it this instruction together with a
reviewed copy of the repository:

> Use the ConnectWunder App Kit to build my application. First read AGENTS.md,
> then ask only for missing business choices. Reuse ConnectWunder services,
> guide me through the necessary sign-in, and test the complete user journey.

The kit is source and instructions, not a hosting subscription. It does not
require Product Machine or an API/model key. Connecting your builder agent does
not authorize the application to reuse that agent's credentials.

## Choose your entrypoint

- Any agent: read [the shared skill](skills/build-connectwunder-app/SKILL.md).
- Codex/ChatGPT or Claude: `node scripts/package-hosts.mjs` creates local
  host-specific skill/plugin packages in `dist/`. Install the reviewed package
  using that host's supported plugin or local-skill interface. The generated
  package is not automatically published to any directory.
- Existing application: use the [server auth helper](skills/build-connectwunder-app/references/auth.md)
  and the default [full workspace sidebar](skills/build-connectwunder-app/references/navigation.md).
  Its native element works without a UI framework; a custom renderer can preserve
  the same complete authorized navigation.

The agent follows [setup](skills/build-connectwunder-app/references/setup.md),
[auth](skills/build-connectwunder-app/references/auth.md),
[data](skills/build-connectwunder-app/references/data.md),
[navigation](skills/build-connectwunder-app/references/navigation.md) and
[security](skills/build-connectwunder-app/references/security.md) as needed.

## Find the official workspace-app contract

Use the `resource` URL returned by the registrar; its path is
`/api/workspace-apps/v1`. Read `GET <resource>/contract` for discovery and
`GET <resource>/openapi` for the full official OpenAPI schemas. Both endpoints
require no authentication and return static contract/configuration only.
See [setup](skills/build-connectwunder-app/references/setup.md) and
[data](skills/build-connectwunder-app/references/data.md) for the live-target check.

This is separate from the general `/openapi.yaml`; missing workspace-app routes
in that older/general specification do not establish incompatibility. A 404 at
the confirmed target's workspace-app discovery endpoint is a feature-not-deployed
blocker to report with its exact URL and status. Do not guess endpoints or replace
apps.* scopes with broad legacy access.

## What is included

- A single maintained Agent Skill, plus short host entrypoints.
- A dependency-free server-only public-PKCE/session helper using Web APIs.
- Full workspace navigation with a native `<connectwunder-nav>` renderer and
  overridable CSS variables; authorized modules, Dashboard areas/apps and settings
  remain familiar alongside the app's own content.
- A small validation flow and synthetic tests. There is no general data API SDK.

Registration belongs to a workspace owner/admin. Application visibility and the
user's original board permissions still limit every read. The kit cannot make
an external operator trustworthy or recall data already returned to that app.

## Verify this source

Use a supported Node runtime with Web Crypto, Request, Response and fetch:

```sh
npm test
npm run check
npm run package:hosts
```

No package installation or build is needed for these checks. Local setup planning
uses `node scripts/setup.mjs check`, `plan` and `configure` to validate registration
plans and prepare runtime configuration. The shared skill guides the agent in
building the app and its full sidebar; the CLI does not generate an app scaffold
or ask for a raw Firebase token. Runtime compatibility
must be measured separately: Node success is not proof of Workers/Sites support.
The provider must support app-specific grant revocation and its bounded parallel
refresh policy. A live installation still needs its own callback, membership,
revocation and repeated-launch acceptance.

## License and boundaries

New kit files are MIT licensed; see [LICENSE](LICENSE). The ConnectWunder name and
service remain separate from this source license. Internal application and
Foundation sources are not included. The kit neither installs nor republishes
internal development tooling. The package is intentionally protected against an
accidental npm publish; distribution/release is performed separately.

## Optional Worker qualification

With an already installed official `workerd` binary, use a new disposable scratch
folder and an ignored evidence folder:

```sh
node scripts/qualify-worker.mjs --binary /path/to/workerd \
  --scratch /new/disposable/worker-check --evidence .local/worker-check
```

The script performs no downloads. It runs the shared auth source in workerd
without Node compatibility, first with an injected synthetic state-machine
provider and then with **native global fetch over actual loopback HTTP**. The
second check covers default and explicit native global-fetch aliases, successful
callback, refresh, revoke and read requests, plus
explicit 3xx rejection and a receiving redirect trap that must see zero requests.
Only loopback IPv4/IPv6 networking is granted; no public provider is contacted.
Source hashes and separate transport coverage are recorded, and all owned
servers/runtimes are closed.

Cancellation is also testable against the real runtime, with no fetch mock:

```sh
node scripts/test-worker-signals.mjs --binary /path/to/workerd \
  --scratch /new/disposable/signal-check --evidence .local/signal-check
```

This interrupts an in-flight native HTTP request with SIGINT and SIGTERM, requires
nonzero canceled exits and checks that the owned runtime and both loopback
interfaces are closed. Cancellation is never reported as a successful qualification.

Earlier injected-provider fixture results qualify helper state transitions, not
native network transport. Neither local check establishes a hosted Sites
installation or live ConnectWunder acceptance; test the deployed application too.

---

[Imprint](https://app.connectwunder.com/legal/en/imprint) · [Privacy](https://app.connectwunder.com/legal/en/privacy)
