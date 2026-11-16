# Navigation and appearance

Use the authorized navigation response as data. Its visibility does not grant
access to the linked app or board. Each destination still checks its own access.
Do not reconstruct hidden links from names or accept arbitrary launch targets.

The optional `src/navigation.js` module registers a browser-native element:

```js
import { defineConnectWunderNavigation } from './src/navigation.js';
defineConnectWunderNavigation();
const navigation = document.querySelector('connectwunder-nav');
navigation.allowedOrigins = approvedNavigationOrigins;
navigation.model = {
  workspaceName: workspaceDisplayName,
  homeHref: approvedConnectWunderHome,
  items: authorizedLinks,
  legal: { imprint: approvedImprintUrl, privacy: approvedPrivacyUrl },
};
```

`items` is a small render model: `{id,label,href,current?}`. Map the provider DTO
explicitly. Workspace display names accept up to 200 characters; ordinary link
labels remain limited to 160. Canonical ConnectWunder return-resolver links keep
their workspace context unchanged. Their query parameters are navigation data,
not authority to select another workspace or bypass destination checks.
`allowedOrigins` contains the exact app, provider and legal-link
origins approved by the deployment configuration. It is not taken from arbitrary
user input. Invalid origins/protocols, token-bearing links and duplicate IDs are
rejected. Labels are rendered as text. The component does not fetch or authorize.

Serve `navigation.js` and adjacent `navigation.css` together. If a bundler moves
assets, ensure its output preserves/resolves the CSS URL. Shadow DOM confines the
optional styles. Override `--cw-nav-background`, `--cw-nav-foreground`,
`--cw-nav-muted`, `--cw-nav-primary`, `--cw-nav-active`, `--cw-nav-border` and
`--cw-nav-font`; `::part(navigation)`, `::part(home-link)`, `::part(item-link)` and
`::part(legal)` provide additional control. Keep contrast and keyboard focus.

A custom renderer can consume the same authorized data without importing this
element or any framework package. Preserve a clear route back to ConnectWunder,
the current workspace and the active destination. Every external-facing page
must have visible Imprint and Privacy links, including loading/error/login pages;
headless rendering must add them itself.

Test desktop and a narrow viewport with actual long labels. Navigation opens
ordinary top-level pages; this kit does not inject remote app code into the
ConnectWunder session or require an iframe. A separate domain/page transition
remains visible in the address bar.
