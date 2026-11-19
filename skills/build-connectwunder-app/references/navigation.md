# Navigation and appearance

## Default for a new workspace app: full sidebar

Build new ConnectWunder-integrated apps with the full authorized workspace
sidebar. Users should find the familiar workspace modules, including People when
allowed, Dashboard overview/areas/apps, and eligible settings/developer links.
Keep the app's own views in its content or local navigation. A single return link
or a flat subset is not the default new-app experience.

Use `src/navigation.js` and adjacent `navigation.css` for the framework-free native
renderer. If the project deliberately uses its own renderer, preserve the same
full authorized model, order, current app, responsive access and legal links.

1. Check the target's official contract, then request
   `GET <resource>/navigation?view=sidebar&locale=de` (or `locale=en`) inside the
   app's authenticated server flow. Follow the [auth](auth.md) transport rules:
   server-only access token, manual redirects, rejection/cancellation of every
   3xx, bounded response and the operation's AbortSignal.
2. Validate the response's workspace/application against the current authorized
   identity and the registered app context. Require `sidebar.schemaVersion === 1`
   and matching `sidebar.workspaceId`. The sidebar is current private data;
   never serve it through a public asset or an unauthenticated JSON route. Its
   visibility is not authorization for any destination. Each destination checks
   access again. Never reconstruct hidden links, recipients or launch targets.
3. Map only the validated fields into a render model. Deliver it through the
   app's protected bootstrap or server-rendered page, without the bearer token.
   If embedding JSON in HTML, escape `<` so labels cannot close a script element;
   use text nodes for labels and do not interpolate raw markup.
4. Mount the same component before data is ready and on sign-in, denied and error
   screens. Initially use a generic workspace label, empty items, and fixed
   deployment-approved home/legal URLs. Replace this with current authorized data
   only after checks succeed. On actor/workspace/access loss remove the old
   private model and cached names, including when a module finishes loading late.

The first normal browser model is the full sidebar, not the legacy flat list:

```js
import { defineConnectWunderNavigation } from './navigation.js';
defineConnectWunderNavigation();
const navigation = document.querySelector('connectwunder-nav');
navigation.allowedOrigins = approvedNavigationOrigins;
navigation.model = {
  presentation: 'sidebar', locale: 'de',
  workspaceName: sidebar.workspaceName, homeHref: sidebar.homeHref,
  activeId: sidebar.activeId, items: sidebar.items, legal: sidebar.legal,
};
```

`sidebar` above is the validated protected server result. The component does not
fetch or authenticate. `allowedOrigins` contains the exact app, provider and
legal-link origins approved by the deployment configuration; never derive them
from arbitrary incoming values. If the confirmed target lacks the advertised
sidebar field/route, report feature-not-deployed and its exact endpoint/status.
Do not silently replace it with a partial menu or broaden OAuth scopes.

The additive version-1 wire model contains `workspaceId`, `workspaceName`,
`homeHref`, optional `activeId`, `items` and `legal`. An item contains
`{id,label,href,icon,section,current?}`. Sections are `dashboards`, `primary`,
`settings`, `developers`. Dashboard overview, areas and accessible apps are peers;
application management appears in Settings only when the server allows it.
People and every other module retain the current workspace's permissions.

Preserve the provider's item order. Each disclosure appears at its first item;
primary links remain in order around it. Dashboard, Settings and Developer groups
use native keyboard-operable disclosures. The active group opens initially;
otherwise Settings and Developers start collapsed. User toggles survive model
redraws in that element only, without browser storage. Primary links have no
extra heading. The authorized settings root keeps its exact URL and appears as
Overview inside Settings, avoiding a duplicate label.

The sidebar accepts at most 200 items, IDs/labels up to 200 Unicode characters,
and approved URLs up to 2048 characters. `activeId` marks the current app; it does
not grant app access. Import `navigationIcons` to inspect the supported icon-name
list; arbitrary SVG, HTML and CSS are not accepted as icons. Labels are text.
Canonical provider return/launch URLs keep their workspace context unchanged;
their query parameters are navigation data, not workspace authority.

## Serving, layout and acceptance

Serve `navigation.js` and adjacent `navigation.css` together. If a bundler moves
assets, preserve or resolve the CSS URL. Shadow DOM confines styles. Override
`--cw-nav-background`, `--cw-nav-foreground`, `--cw-nav-muted`, `--cw-nav-primary`,
`--cw-nav-active`, `--cw-nav-active-foreground`, `--cw-nav-border`,
`--cw-nav-surface`, `--cw-nav-font` and `--cw-nav-width` as needed;
`::part(navigation)`, `::part(home-link)`, `::part(item-link)` and `::part(legal)`
provide additional control. Preserve contrast and visible keyboard focus.

Give the element a definite desktop height, for example `100dvh`, and reserve
its default `16rem` width beside the app. That width includes the desktop rail's
8px inset around its bordered, 10px-rounded panel. The default typography,
32px rows, 16px icons, 28px text subrows and semantic colors follow ConnectWunder's
Core appearance. The current workspace name appears in the compact footer;
no current-user identity, account action or unread count is inferred from it.

The brand mark is a public PNG at the fixed `/brand/connectwunder-mark.png` path
on the supported `https://beta.connectwunder.com` or
`https://app.connectwunder.com` home origin. The component never accepts an image
URL or markup from the navigation model. Its 24px space is reserved; the wordmark
stays usable if the image fails. A host CSP must allow that exact public image
source; do not broaden authenticated `connect-src` or expose tokens. The mark's
rights remain separate from this MIT code; no brand binary is bundled.

The component uses `Inter, sans-serif` by default. If the document already defines
Inter, it reuses that font. Otherwise it registers the fixed public Inter subsets
from `https://fonts.gstatic.com/s/inter/v20/` through the native FontFace API once
per document. The browser loads only glyph subsets needed by rendered text, using
`font-display: swap`; registration never waits for a font download or stylesheet.
If the API, CSP or network blocks a font, navigation stays usable with sans-serif.
A host CSP can allow the fixed font paths advertised in `navigation.js` under
`font-src`; no Google stylesheet/style origin or authenticated `connect-src`
expansion is needed. To keep the component on an existing host font, override
`--cw-nav-font`. No font binary is packaged. Inter's font software is separately
licensed under the [SIL Open Font License](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt),
not the kit's MIT source license. Font request behavior follows the host's normal
browser and referrer policy, as in Core's existing Google Fonts delivery.

At 48rem or below it becomes a 56px header with a labeled menu
button opening a native modal drawer with focus containment, Escape, backdrop
dismissal and focus return. The drawer is 18rem wide when space allows. Keep any
application-owned sticky-header offset synchronized with the 56px mobile header. A React adapter only needs a ref that sets the two
properties; the kit itself has no framework dependency.

Keep a visible route back and Imprint/Privacy links in normal, loading, sign-in,
denied and error states. Before authorized navigation exists, only fixed trusted
home/legal URLs are available; afterwards follow the provider's exact opaque
workspace-bound href. Headless/custom rendering owns the same requirements.

Verify an actual new-project browser journey: full sidebar beside useful app
content, authorized modules/apps only, current app, correct-workspace return,
long labels, narrow screen, disclosure keyboard access, mobile focus/Escape,
loading/error fallback, and immediate private-model removal after access loss.
Navigation opens ordinary top-level pages; no iframe or remote app code is
injected into the ConnectWunder session. Different domains remain visible in the
address bar.

## Native stylesheet readiness

The native renderer stages its full menu and mobile controls off the live shadow
DOM. It attaches them only after the current adjacent stylesheet is applied.
Before that it shows plain, localized status text with the validated current
ConnectWunder home-return and legal links; workspace names, private destination
labels, images and SVGs are not attached. No inline style or host-framework guard
is required for this safe fallback.

Observe the host's `data-cw-navigation-state` attribute when a framework adapter
needs readiness: `loading` is set before each render, `ready` only after the
current styled fragment is attached, and `error` on stylesheet failure or its
8-second deadline. Read its initial value and observe subsequent attribute
changes; a listener on an older stylesheet does not describe the current render.
These presentation states never grant data or destination access.

The component checks both the current stylesheet and its computed
`--cw-nav-stylesheet-ready: 1` marker. A non-null `link.sheet` or a load event
alone is not proof that the styles applied. The marker is reserved for the
matching shipped stylesheet; do not set it as a theme override. Serve the exact
JavaScript/CSS pair together.

An error/deadline is terminal for that render. A late load cannot attach its
staged menu. Model changes, media redraws and disconnects cancel the old listeners,
timer and fragment; a subsequent current render can recover when its stylesheet
is valid. Host access/actor changes must still replace private models as described
above. Font registration remains nonblocking and independent of this CSS gate.

## Existing flat integrations

The older small render model remains compatible for an existing or deliberately
limited integration. It does not become the new-project default:

```js
navigation.model = {
  workspaceName: workspaceDisplayName,
  homeHref: approvedConnectWunderHome,
  items: authorizedLinks,
  legal: { imprint: approvedImprintUrl, privacy: approvedPrivacyUrl },
};
```

Flat items use `{id,label,href,current?}`, up to 60 items with 160-character labels.
Workspace names accept 200 characters. Both modes reject unsafe origins,
credentials, token-bearing links and duplicate IDs. The renderer never replaces
server authorization.
