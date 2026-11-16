# ConnectWunder App Kit

Build a private application around your ConnectWunder workspace with an AI agent.
Keep your preferred frontend framework and hosting. Use ConnectWunder for the
workspace, access controls, supported data and the route back to your team.

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
  and optional [navigation element](skills/build-connectwunder-app/references/navigation.md).

The agent follows [setup](skills/build-connectwunder-app/references/setup.md),
[auth](skills/build-connectwunder-app/references/auth.md),
[data](skills/build-connectwunder-app/references/data.md),
[navigation](skills/build-connectwunder-app/references/navigation.md) and
[security](skills/build-connectwunder-app/references/security.md) as needed.

## What is included

- A single maintained Agent Skill, plus short host entrypoints.
- A dependency-free server-only public-PKCE/session helper using Web APIs.
- An optional native `<connectwunder-nav>` element and overridable CSS variables.
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
is available through `node scripts/setup.mjs` and never asks for a raw Firebase token. Runtime compatibility
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

The script performs no downloads and starts only a loopback synthetic provider
fixture. It runs the same auth source inside workerd without Node compatibility,
records source hashes and closes its own runtime. This proves local runtime
behavior, not a hosted Sites installation or live ConnectWunder acceptance.
