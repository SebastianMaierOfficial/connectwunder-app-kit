/* BEGIN GENERATED NAVIGATION CONTRACT */
/** ConnectWunder public navigation contract, MIT. */
/* Lucide 0.475.0 icon geometry
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
const navigationContractVersion = '0.2.4-core.1';

const modelIconNodes = {
  "dashboard": [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M3 9h18"}],["path",{"d":"M9 21V9"}]], // PanelsTopLeft
  "inbox": [["polyline",{"points":"22 12 16 12 14 15 10 15 8 12 2 12"}],["path",{"d":"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"}]], // Inbox
  "todos": [["rect",{"x":"3","y":"5","width":"6","height":"6","rx":"1"}],["path",{"d":"m3 17 2 2 4-4"}],["path",{"d":"M13 6h8"}],["path",{"d":"M13 12h8"}],["path",{"d":"M13 18h8"}]], // ListTodo
  "people": [["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["circle",{"cx":"9","cy":"7","r":"4"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["path",{"d":"M16 3.13a4 4 0 0 1 0 7.75"}]], // Users
  "companies": [["path",{"d":"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"}],["path",{"d":"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"}],["path",{"d":"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"}],["path",{"d":"M10 6h4"}],["path",{"d":"M10 10h4"}],["path",{"d":"M10 14h4"}],["path",{"d":"M10 18h4"}]], // Building2
  "events": [["path",{"d":"M8 2v4"}],["path",{"d":"M16 2v4"}],["rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}],["path",{"d":"M3 10h18"}],["path",{"d":"M8 14h.01"}],["path",{"d":"M12 14h.01"}],["path",{"d":"M16 14h.01"}],["path",{"d":"M8 18h.01"}],["path",{"d":"M12 18h.01"}],["path",{"d":"M16 18h.01"}]], // CalendarDays
  "boards": [["path",{"d":"M6 5v11"}],["path",{"d":"M12 5v6"}],["path",{"d":"M18 5v14"}]], // Kanban
  "documents": [["path",{"d":"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{"d":"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{"d":"M10 9H8"}],["path",{"d":"M16 13H8"}],["path",{"d":"M16 17H8"}]], // FileText
  "app": [["rect",{"x":"2","y":"4","width":"20","height":"16","rx":"2"}],["path",{"d":"M10 4v4"}],["path",{"d":"M2 8h20"}],["path",{"d":"M6 4v4"}]], // AppWindow
  "team": [["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["circle",{"cx":"9","cy":"7","r":"4"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["path",{"d":"M16 3.13a4 4 0 0 1 0 7.75"}]], // Users
  "settings": [["path",{"d":"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"}],["circle",{"cx":"12","cy":"12","r":"3"}]], // Settings
  "news": [["path",{"d":"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"}],["path",{"d":"M20 3v4"}],["path",{"d":"M22 5h-4"}],["path",{"d":"M4 17v2"}],["path",{"d":"M5 18H3"}]], // Sparkles
  "help": [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m4.93 4.93 4.24 4.24"}],["path",{"d":"m14.83 9.17 4.24-4.24"}],["path",{"d":"m14.83 14.83 4.24 4.24"}],["path",{"d":"m9.17 14.83-4.24 4.24"}],["circle",{"cx":"12","cy":"12","r":"4"}]], // LifeBuoy
  "code": [["path",{"d":"m18 16 4-4-4-4"}],["path",{"d":"m6 8-4 4 4 4"}],["path",{"d":"m14.5 4-5 16"}]], // Code2
  "book": [["path",{"d":"M12 7v14"}],["path",{"d":"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"}]], // BookOpen
  "area": [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M3 9h18"}],["path",{"d":"M9 21V9"}]], // PanelsTopLeft
  "account": [["circle",{"cx":"18","cy":"15","r":"3"}],["circle",{"cx":"9","cy":"7","r":"4"}],["path",{"d":"M10 15H6a4 4 0 0 0-4 4v2"}],["path",{"d":"m21.7 16.4-.9-.3"}],["path",{"d":"m15.2 13.9-.9-.3"}],["path",{"d":"m16.6 18.7.3-.9"}],["path",{"d":"m19.1 12.2.3-.9"}],["path",{"d":"m19.6 18.7-.4-1"}],["path",{"d":"m16.8 12.3-.4-1"}],["path",{"d":"m14.3 16.6 1-.4"}],["path",{"d":"m20.7 13.8 1-.4"}]], // UserCog
  "notifications": [["path",{"d":"M10.268 21a2 2 0 0 0 3.464 0"}],["path",{"d":"M22 8c0-2.3-.8-4.3-2-6"}],["path",{"d":"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"}],["path",{"d":"M4 2C2.8 3.7 2 5.7 2 8"}]], // BellRing
  "workspace": [["circle",{"cx":"12","cy":"8","r":"5"}],["path",{"d":"M20 21a8 8 0 0 0-16 0"}]], // UserRound
  "billing": [["path",{"d":"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"}],["path",{"d":"M14 8H8"}],["path",{"d":"M16 12H8"}],["path",{"d":"M13 16H8"}]], // ReceiptText
  "integrations": [["rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}],["path",{"d":"M16 2v4"}],["path",{"d":"M3 10h18"}],["path",{"d":"M8 2v4"}],["path",{"d":"M17 14h-6"}],["path",{"d":"M13 18H7"}],["path",{"d":"M7 14h.01"}],["path",{"d":"M17 18h.01"}]], // CalendarRange
  "api-key": [["path",{"d":"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"}],["circle",{"cx":"16.5","cy":"7.5","r":".5","fill":"currentColor"}]], // KeyRound
  "automation": [["path",{"d":"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"}]], // Zap
  "history": [["rect",{"width":"20","height":"5","x":"2","y":"3","rx":"1"}],["path",{"d":"M4 8v11a2 2 0 0 0 2 2h2"}],["path",{"d":"M20 8v11a2 2 0 0 1-2 2h-2"}],["path",{"d":"m9 15 3-3 3 3"}],["path",{"d":"M12 12v9"}]], // ArchiveRestore
};

const navigationIcons = Object.freeze(/** @type {(keyof typeof modelIconNodes)[]} */ (Object.keys(modelIconNodes)));
const navigationIconNodes = {
  ...modelIconNodes,
  "api-docs": [["path",{"d":"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"}],["path",{"d":"M8 11h8"}],["path",{"d":"M8 7h6"}]], // BookText
  "mcp-docs": [["path",{"d":"M12 8V4H8"}],["rect",{"width":"16","height":"12","x":"4","y":"8","rx":"2"}],["path",{"d":"M2 14h2"}],["path",{"d":"M20 14h2"}],["path",{"d":"M15 13v2"}],["path",{"d":"M9 13v2"}]], // Bot
  "ai-agents": [["path",{"d":"M12 8V4H8"}],["rect",{"width":"16","height":"12","x":"4","y":"8","rx":"2"}],["path",{"d":"M2 14h2"}],["path",{"d":"M20 14h2"}],["path",{"d":"M15 13v2"}],["path",{"d":"M9 13v2"}]], // Bot
  "modules": [["line",{"x1":"21","x2":"14","y1":"4","y2":"4"}],["line",{"x1":"10","x2":"3","y1":"4","y2":"4"}],["line",{"x1":"21","x2":"12","y1":"12","y2":"12"}],["line",{"x1":"8","x2":"3","y1":"12","y2":"12"}],["line",{"x1":"21","x2":"16","y1":"20","y2":"20"}],["line",{"x1":"12","x2":"3","y1":"20","y2":"20"}],["line",{"x1":"14","x2":"14","y1":"2","y2":"6"}],["line",{"x1":"8","x2":"8","y1":"10","y2":"14"}],["line",{"x1":"16","x2":"16","y1":"18","y2":"22"}]], // SlidersHorizontal
  "connectors": [["path",{"d":"M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"}],["path",{"d":"m2 22 3-3"}],["path",{"d":"M7.5 13.5 10 11"}],["path",{"d":"M10.5 16.5 13 14"}],["path",{"d":"m18 3-4 4h6l-4 4"}]], // PlugZap
  "scheduled": [["path",{"d":"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"}],["path",{"d":"M16 2v4"}],["path",{"d":"M8 2v4"}],["path",{"d":"M3 10h5"}],["path",{"d":"M17.5 17.5 16 16.3V14"}],["circle",{"cx":"16","cy":"16","r":"6"}]], // CalendarClock
  "facts": [["path",{"d":"M21 12h-8"}],["path",{"d":"M21 6H8"}],["path",{"d":"M21 18h-8"}],["path",{"d":"M3 6v4c0 1.1.9 2 2 2h3"}],["path",{"d":"M3 10v6c0 1.1.9 2 2 2h3"}]], // ListTree
  "migrations": [["path",{"d":"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{"d":"M3 3v5h5"}],["path",{"d":"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"}],["path",{"d":"M16 16h5v5"}]], // RefreshCcw
  "expand": [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M9 3v18"}],["path",{"d":"m14 9 3 3-3 3"}]], // PanelLeftOpen
  "collapse": [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M9 3v18"}],["path",{"d":"m16 15-3-3 3-3"}]], // PanelLeftClose
  "menu": [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M9 3v18"}]], // PanelLeft
  "close": [["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]], // X
  "chevron": [["path",{"d":"m9 18 6-6-6-6"}]], // ChevronRight
  "plus": [["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]], // Plus
  "legal": [["path",{"d":"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}],["path",{"d":"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}],["path",{"d":"M7 21h10"}],["path",{"d":"M12 3v18"}],["path",{"d":"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"}]], // Scale
  "brand": [["path",{"d":"M12 12h.01"}],["path",{"d":"M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"}],["path",{"d":"M22 13a18.15 18.15 0 0 1-20 0"}],["rect",{"width":"20","height":"14","x":"2","y":"6","rx":"2"}]], // BriefcaseBusiness
};

const navigationSvg = Object.freeze({
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
});

// Version 1 providers use the original wire icon names. Resolve more precise
// icons by stable item ID so existing bundled renderers keep accepting the model.
const itemIcons = {
  'connectwunder-api-docs': 'api-docs',
  'connectwunder-mcp-docs': 'mcp-docs',
  'connectwunder-setting-modules': 'modules',
  'connectwunder-setting-mcp-connectors': 'connectors',
  'connectwunder-setting-ai-agents': 'ai-agents',
  'connectwunder-setting-scheduled-tasks': 'scheduled',
  'connectwunder-setting-fact-definitions': 'facts',
  'connectwunder-setting-migrations': 'migrations',
};

/** @param {{id: string, icon?: keyof typeof modelIconNodes}} item
 * @returns {keyof typeof navigationIconNodes} */
function navigationItemIcon({id, icon}) {
  return Object.hasOwn(itemIcons, id)
    ? /** @type {keyof typeof navigationIconNodes} */ (itemIcons[/** @type {keyof typeof itemIcons} */ (id)])
    : icon || 'app';
}

const navigationGroupIcons = /** @type {const} */ ({
  dashboards: 'dashboard', settings: 'settings', developers: 'code',
});

const navigationTokens = Object.freeze({
  width: '16rem', drawerWidth: '18rem', railWidth: '4.125rem', railPanelWidth: '3rem',
  breakpoint: '48rem', rowHeight: '2rem', subrowHeight: '1.75rem', iconSize: '1rem',
  inset: '.5rem', radius: '10px', flyoutWidth: '16rem', flyoutGap: 10,
  background: '230.0 60.0% 98.0%', foreground: '215.0 18.0% 39.2%', primary: '243.4 75.4% 58.6%',
  active: '225.9 100.0% 96.7%', activeForeground: '244.5 57.9% 50.6%', border: '213.3 34.6% 89.8%',
});

const navigationCopy = Object.freeze({
  de: {expand: 'Navigation ausklappen', collapse: 'Navigation einklappen'},
  en: {expand: 'Expand navigation', collapse: 'Collapse navigation'},
});

/** @param {boolean} mobile @param {boolean} expanded */
function navigationMode(mobile, expanded) {
  return mobile ? 'drawer' : expanded ? 'expanded' : 'compact';
}

const preferenceKey = 'sidebar_state';

/** @param {Pick<Document, "cookie">} document */
function readNavigationExpanded(document) {
  try {
    return !document.cookie?.split('; ').includes(preferenceKey + '=false');
  } catch {
    return true;
  }
}

/** @param {Pick<Document, "cookie">} document @param {boolean} expanded */
function writeNavigationExpanded(document, expanded) {
  try {
    document.cookie = preferenceKey + '=' + expanded + '; path=/; max-age=604800; SameSite=Lax';
  } catch { /* The control remains usable when preference storage is unavailable. */ }
}
/* END GENERATED NAVIGATION CONTRACT */
/** Optional native navigation. Input is a render model, not authorization. */
export { navigationIcons, navigationContractVersion };
const sections = ['primary', ...Object.keys(navigationGroupIcons)];
// Brand images are public presentation assets, never supplied by a private model.
const brandOrigins = new Set(['https://beta.connectwunder.com','https://app.connectwunder.com']);
// Fixed public Inter subsets from Google's Core font delivery; no stylesheet or font binary is bundled.
const interSubsets = [
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7W0Q5n-wU.woff2",
    "unicodeRange": "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7W0Q5n-wU.woff2",
    "unicodeRange": "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7W0Q5n-wU.woff2",
    "unicodeRange": "U+1F00-1FFF"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7W0Q5n-wU.woff2",
    "unicodeRange": "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7W0Q5n-wU.woff2",
    "unicodeRange": "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7W0Q5n-wU.woff2",
    "unicodeRange": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF"
  },
  {
    "source": "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
    "unicodeRange": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
  }
];
const fontDocuments = new WeakSet();
function registerCoreFont(ownerDocument) {
  if (typeof globalThis.FontFace !== 'function' || !ownerDocument.fonts || fontDocuments.has(ownerDocument)) return;
  fontDocuments.add(ownerDocument);
  try {
    if ([...ownerDocument.fonts].some(face => String(face.family).replace(/^['"]|['"]$/gu,'') === 'Inter')) return;
    for (const subset of interSubsets) {
      const face = new globalThis.FontFace('Inter', 'url("'+subset.source+'")', {
        style:'normal',weight:'100 900',display:'swap',unicodeRange:subset.unicodeRange,
      });
      face.loaded?.catch(()=>{});
      ownerDocument.fonts.add(face);
    }
  } catch {
    // Font support/CSP/network failure retains the immediately usable sans-serif fallback.
  }
}
const copy = {
  de: { loading:'Navigation wird geladen.',unavailable:'Die Navigation ist gerade nicht verfügbar. Du kannst ConnectWunder öffnen oder die Seite erneut laden.',menu:'Navigation öffnen',close:'Navigation schließen',dashboards:'Dashboards',legal:'Rechtliche Informationen',settings:'Einstellungen',developers:'Entwickler',home:'ConnectWunder öffnen',overview:'Übersicht',empty:'Verbinde dich mit ConnectWunder, um deine Navigation zu laden.' },
  en: { loading:'Loading navigation.',unavailable:'Navigation is currently unavailable. You can open ConnectWunder or reload this page.',menu:'Open navigation',close:'Close navigation',dashboards:'Dashboards',legal:'Legal information',settings:'Settings',developers:'Developers',home:'Open ConnectWunder',overview:'Overview',empty:'Connect to ConnectWunder to load your navigation.' },
};
export function normalizeNavigation(model, allowedOrigins, baseOrigin) {
  if (!model || !Array.isArray(model.items) || model.items.length > (model.presentation === 'sidebar' ? 200 : 60) || !Array.isArray(allowedOrigins) || allowedOrigins.length > 40) throw new TypeError('Navigation model is invalid');
  const origins = new Set(allowedOrigins.map(value => {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) throw new TypeError('Navigation origin is invalid');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new TypeError('Navigation origin is invalid');
    return url.origin;
  }));
  const label = (value, maxLength = 160) => {
    if (typeof value !== 'string' || !value.trim() || [...value].length > maxLength || /[\u0000-\u001f]/u.test(value)) throw new TypeError('Navigation label is invalid');
    return value.trim();
  };
  const link = value => {
    if (typeof value !== 'string' || !value || value.length > 2048 || /[\u0000-\u001f]/u.test(value)) throw new TypeError('Navigation link is invalid');
    const url = new URL(value, baseOrigin);
    if (!origins.has(url.origin) || url.username || url.password) throw new TypeError('Navigation link is not allowed');
    if ([...url.searchParams.keys()].some(key => /^(?:access_token|refresh_token|token|code|code_verifier)$/iu.test(key))) throw new TypeError('Navigation link must not contain credentials');
    return url.href;
  };
  if (model.presentation !== undefined && !['sidebar','list'].includes(model.presentation)) throw new TypeError('Navigation presentation is invalid');
  if (model.locale !== undefined && !['de','en'].includes(model.locale)) throw new TypeError('Navigation locale is invalid');
  const locale = model.locale || 'de';
  const activeId = model.activeId === undefined ? undefined : label(model.activeId, model.presentation === 'sidebar' ? 200 : 160);
  const ids = new Set();
  const items = model.items.map(item => {
    const id = label(item?.id, model.presentation === 'sidebar' ? 200 : 160);
    if (ids.has(id)) throw new TypeError('Navigation IDs must be unique');
    ids.add(id);
    if (item.section !== undefined && !sections.includes(item.section)) throw new TypeError('Navigation section is invalid');
    if (item.icon !== undefined && !navigationIcons.includes(item.icon)) throw new TypeError('Navigation icon is invalid');
    return Object.freeze({ id, label: label(item.label, model.presentation === 'sidebar' ? 200 : 160), href: link(item.href), current: item.current === true || id === activeId,
      ...(item.section === undefined ? {} : {section:item.section}), ...(item.icon === undefined ? {} : {icon:item.icon}) });
  });
  return Object.freeze({
    label: label(model.label || 'Workspace-Navigation'), workspaceName: label(model.workspaceName, 200),
    homeHref: link(model.homeHref), homeLabel: label(model.homeLabel || copy[locale].home),
    legal: model.legal ? Object.freeze({ imprint: link(model.legal.imprint), privacy: link(model.legal.privacy) }) : null,
    emptyLabel: label(model.emptyLabel || (model.presentation === 'sidebar' ? copy[locale].empty : 'Keine weiteren Anwendungen verfügbar.')),
    presentation:model.presentation || 'list', locale, ...(activeId === undefined ? {} : {activeId}), items:Object.freeze(items),
  });
}

const svgNamespace = 'http://www.w3.org/2000/svg';
function icon(name) {
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  for (const [name, value] of Object.entries(navigationSvg)) {
    svg.setAttribute(name === 'viewBox' ? name : name.replace(/[A-Z]/gu, char => '-'+char.toLowerCase()), value);
  }
  for (const [tag, properties] of navigationIconNodes[name]) {
    const node = document.createElementNS(svgNamespace, tag);
    for (const [key, value] of Object.entries(properties)) node.setAttribute(key, value);
    svg.append(node);
  }
  return svg;
}

function positionFromTrigger(panel, trigger, height = 0) {
  const anchor = trigger.getBoundingClientRect();
  const gap = navigationTokens.flyoutGap;
  panel.style.left = Math.round(anchor.right + gap)+'px';
  panel.style.top = Math.max(gap, Math.min(Math.round(anchor.top), window.innerHeight-height-gap))+'px';
}

function compactDisclosure({id, label, iconName, active, body}) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'compact-trigger';
  trigger.setAttribute('aria-label', label);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('popovertarget', id);
  trigger.toggleAttribute('data-current', active);
  trigger.append(icon(iconName));

  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'flyout';
  panel.setAttribute('popover', 'auto');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', label);
  panel.append(body);
  panel.querySelector('a')?.setAttribute('autofocus', '');
  trigger.addEventListener('click', () => {
    if (!panel.matches(':popover-open')) trigger.focus({preventScroll:true});
  });
  panel.addEventListener('beforetoggle', event => {
    const open = event.newState === 'open';
    trigger.setAttribute('aria-expanded', String(open));
    if (open) positionFromTrigger(panel, trigger);
  });
  panel.addEventListener('toggle', () => {
    if (panel.matches(':popover-open')) positionFromTrigger(panel, trigger, panel.offsetHeight);
  });
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    panel.hidePopover();
    trigger.focus({preventScroll:true});
  });
  panel.addEventListener('click', event => {
    if (event.target.closest?.('a') && panel.matches(':popover-open')) panel.hidePopover();
  });
  const container = document.createElement('div');
  container.className = 'compact-only';
  container.append(trigger, panel);
  return {container, trigger, panel};
}

/** Call in the browser. Server imports have no DOM side effect. */
export function defineConnectWunderNavigation(tagName = 'connectwunder-nav') {
  if (!globalThis.customElements || !globalThis.HTMLElement) throw new TypeError('A browser is required');
  if (customElements.get(tagName)) return customElements.get(tagName);
  class ConnectWunderNavigation extends HTMLElement {
    #model = null; #origins = [location.origin]; #media = null; #expanded = new Map(); #selection = null; #generation = 0; #connected = false; #release = null;
    #desktopExpanded = true;
    #resize = () => this.#render();
    constructor() { super(); this.attachShadow({mode:'open'}); }
    set allowedOrigins(origins) {
      if (!Array.isArray(origins) || origins.length > 40) throw new TypeError('Navigation origins are invalid');
      const next = this.#model ? normalizeNavigation(this.#model,origins,location.origin) : null;
      this.#origins=[...origins];if(next){this.#model=next;this.#render();}
    }
    get allowedOrigins(){return [...this.#origins];}
    set model(value){
      const next=normalizeNavigation(value,this.#origins,location.origin);
      const selected=next.items.find(item=>item.current);
      if(selected && selected.id!==this.#selection)this.#expanded.set(selected.section || 'primary',true);
      this.#selection=selected?.id || null;this.#model=next;this.#render();
    }
    get model(){return this.#model;}
    connectedCallback(){this.#connected=true;this.#desktopExpanded=readNavigationExpanded(document);this.#media=globalThis.matchMedia?.('(width < '+navigationTokens.breakpoint+')') || null;this.#media?.addEventListener('change',this.#resize);this.#render();}
    disconnectedCallback(){
      this.#connected=false;++this.#generation;this.#release?.();this.#release=null;
      this.#media?.removeEventListener('change',this.#resize);this.shadowRoot.querySelector('dialog')?.close();
      this.shadowRoot.replaceChildren();this.removeAttribute?.('data-cw-navigation-mode');this.setAttribute('data-cw-navigation-state','loading');
    }
    #render(){
      const generation=++this.#generation;
      this.#release?.();this.#release=null;this.removeAttribute?.('data-cw-navigation-mode');this.setAttribute('data-cw-navigation-state','loading');
      const root=this.shadowRoot;root.querySelector('dialog')?.close();root.replaceChildren();
      const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./navigation.css',import.meta.url).href;
      if(!this.#model){root.append(sheet);return;}
      const model=this.#model,words=copy[model.locale],sidebar=model.presentation==='sidebar';
      const mobile = Boolean(this.#media?.matches);
      const desktopControl = sidebar && !mobile && typeof HTMLElement.prototype.showPopover === 'function';
      const mode = () => navigationMode(mobile, !desktopControl || this.#desktopExpanded);
      if(sidebar)registerCoreFont(document);
      this.toggleAttribute('sidebar',sidebar);
      // No full menu, image or SVG enters the live tree before its stylesheet is ready.
      const status=document.createElement('div');status.setAttribute('part','status');status.setAttribute('role','status');
      const statusCopy=document.createElement('p');statusCopy.textContent=words.loading;status.append(statusCopy);
      const homeStatus=document.createElement('p'),homeReturn=document.createElement('a');homeReturn.href=model.homeHref;homeReturn.textContent=words.home;homeStatus.append(homeReturn);status.append(homeStatus);
      if(model.legal){const legalStatus=document.createElement('p');for(const[key,title]of[['imprint','Imprint'],['privacy','Privacy']]){const a=document.createElement('a');a.href=model.legal[key];a.textContent=title;legalStatus.append(a,document.createTextNode(' '));}status.append(legalStatus);}
      const fragment=document.createDocumentFragment();
      const nav=document.createElement('nav');nav.setAttribute('aria-label',model.label);nav.setAttribute('part','navigation');
      const homeLink=(interactive=true)=>{
        const home=document.createElement(interactive?'a':'div');home.className='home';
        if(interactive){home.href=model.homeHref;home.setAttribute('part','home-link');}
        if(!sidebar){home.textContent=model.homeLabel;return home;}
        const mark=document.createElement('span');mark.className='brand-mark';mark.setAttribute('aria-hidden','true');
        const origin=new URL(model.homeHref).origin;
        if(brandOrigins.has(origin)){
          const image=document.createElement('img');image.src=origin+'/brand/connectwunder-mark.png';image.alt='';
          image.setAttribute('width','24');image.setAttribute('height','24');image.referrerPolicy='no-referrer';image.decoding='async';
          image.addEventListener('error',()=>{image.hidden=true;});mark.append(image);
        }else mark.append(icon('brand'));
        const brand=document.createElement('span');brand.className='brand';brand.textContent='ConnectWunder';
        home.append(mark,brand);if(interactive)home.setAttribute('aria-label',model.homeLabel);return home;
      };
      const home = homeLink();
      const tooltip = document.createElement('div');
      tooltip.className = 'rail-tooltip';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.hidden = true;
      const flyouts = [];
      const closeOverlays = () => {
        tooltip.hidden = true;
        for (const panel of flyouts) {
          if (panel.matches(':popover-open')) panel.hidePopover();
        }
      };
      const railTooltip = (trigger, label) => {
        if (!desktopControl) return;
        const show = () => {
          if (mode() !== 'compact' || trigger.getAttribute('aria-expanded') === 'true' ||
              flyouts.some(panel => panel.matches(':popover-open'))) return;
          tooltip.textContent = label;
          tooltip.hidden = false;
          positionFromTrigger(tooltip, trigger, tooltip.offsetHeight);
        };
        trigger.addEventListener('pointerenter', show);
        trigger.addEventListener('focus', show);
        trigger.addEventListener('pointerleave', () => { tooltip.hidden = true; });
        trigger.addEventListener('blur', () => { tooltip.hidden = true; });
        trigger.addEventListener('click', () => { tooltip.hidden = true; });
        trigger.addEventListener('keydown', event => {
          if (event.key === 'Escape') tooltip.hidden = true;
        });
      };
      const disclosure = (options) => {
        const {container, trigger, panel} = compactDisclosure(options);
        flyouts.push(panel);
        railTooltip(trigger, options.label);
        return container;
      };

      if(sidebar){
        const header = document.createElement('div');
        header.className = 'navigation-header';
        header.append(home);
        if (desktopControl) {
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'rail-toggle';
          const toggleLabel = () => this.#desktopExpanded ? navigationCopy[model.locale].collapse : navigationCopy[model.locale].expand;
          const updateToggle = () => {
            const label = toggleLabel();
            toggle.setAttribute('aria-label', label);
            toggle.setAttribute('aria-expanded', String(this.#desktopExpanded));
            toggle.title = label;
            toggle.replaceChildren(icon(this.#desktopExpanded ? 'collapse' : 'expand'));
          };
          updateToggle();
          toggle.addEventListener('click', () => {
            closeOverlays();
            this.#desktopExpanded = !this.#desktopExpanded;
            writeNavigationExpanded(document, this.#desktopExpanded);
            this.setAttribute('data-cw-navigation-mode', mode());
            updateToggle();
          });
          header.append(toggle);
        }
        nav.append(header);
      }else nav.append(home);
      const workspace=document.createElement('p');workspace.className='workspace';workspace.textContent=model.workspaceName;workspace.title=model.workspaceName;
      if(!sidebar)nav.append(workspace);
      const body=document.createElement('div');body.className='links';
      if (desktopControl) body.addEventListener('scroll', closeOverlays);
      if(!model.items.length){const empty=document.createElement('p');empty.className='empty';empty.textContent=model.emptyLabel;body.append(empty);}

      const itemList = (items, primary = false) => {
        const list = document.createElement('ul');
        for (const item of items) {
          const row = document.createElement('li');
          const link = document.createElement('a');
          link.href = item.href;
          link.setAttribute('part', 'item-link');
          if (!primary) link.title = item.label;
          const label = sidebar && item.section === 'settings' && item.id === 'connectwunder-settings' ? words.overview : item.label;
          if (sidebar && item.section !== 'dashboards') link.append(icon(navigationItemIcon(item)));
          const text = document.createElement('span');
          text.textContent = label;
          link.append(text);
          if (item.current) link.setAttribute('aria-current', 'page');
          if (sidebar && primary) {
            link.setAttribute('aria-label', label);
            railTooltip(link, label);
          }
          row.append(link);
          list.append(row);
        }
        return list;
      };
      if (sidebar) {
        const emitted = new Set();
        let primary = [];
        const flushPrimary = () => {
          if (primary.length) body.append(itemList(primary, true));
          primary = [];
        };
        for (const next of model.items) {
          const section = next.section || 'primary';
          if (section === 'primary') { primary.push(next); continue; }
          if (emitted.has(section)) continue;
          flushPrimary();
          emitted.add(section);
          const items = model.items.filter(item => item.section === section);
          const active = items.some(item => item.current);
          const itemIcon = navigationGroupIcons[section];
          const group = document.createElement('details');
          group.className = 'group';
          group.setAttribute('data-section', section);
          group.open = this.#expanded.has(section) ? this.#expanded.get(section) : active;
          const summary = document.createElement('summary');
          if (active) summary.className = 'current';
          const title = document.createElement('span');
          title.textContent = words[section];
          const chevron = icon('chevron');
          chevron.setAttribute('class', 'chevron');
          summary.append(icon(itemIcon), title, chevron);
          group.append(summary, itemList(items));
          group.addEventListener('toggle', () => {
            if (this.#generation === generation && group.isConnected !== false) this.#expanded.set(section, group.open);
          });
          body.append(group);
          if (desktopControl) {
            body.append(disclosure({
              id: 'cw-nav-'+section, label: words[section], iconName: itemIcon, active, body: itemList(items),
            }));
          }
        }
        flushPrimary();
      } else body.append(itemList(model.items));
      nav.append(body);
      const footer=sidebar?document.createElement('div'):nav;
      if(sidebar){footer.className='navigation-footer';footer.setAttribute('part','workspace-footer');footer.append(workspace);}
      const legalLinks = () => {
        const legal = document.createElement('div');
        legal.className = 'legal';
        legal.setAttribute('part', 'legal');
        for (const [key, title] of [['imprint','Imprint'],['privacy','Privacy']]) {
          const link = document.createElement('a');
          link.href = model.legal[key];
          link.textContent = title;
          legal.append(link);
        }
        return legal;
      };
      if (model.legal) {
        footer.append(legalLinks());
        if (desktopControl) footer.append(disclosure({
          id: 'cw-nav-legal', label: words.legal, iconName: 'legal', active: false, body: legalLinks(),
        }));
      }
      if(sidebar)nav.append(footer);
      if(sidebar && mobile){
        const bar=document.createElement('div');bar.className='mobile-bar';
        const toggle=document.createElement('button');toggle.type='button';toggle.className='menu-toggle';toggle.setAttribute('aria-label',words.menu);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-haspopup','dialog');toggle.append(icon('menu'));bar.append(toggle,homeLink(false));
        const dialog=document.createElement('dialog');dialog.setAttribute('aria-label',model.label);
        const close=document.createElement('button');close.type='button';close.className='close';close.setAttribute('aria-label',words.close);close.append(icon('close'));
        close.addEventListener('click',()=>dialog.close());dialog.append(close,nav);
        toggle.addEventListener('click',()=>{if(this.#generation!==generation || !this.#connected || this.isConnected===false)return;dialog.showModal();toggle.setAttribute('aria-expanded','true');});
        dialog.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');if(this.#generation===generation && this.#connected && this.isConnected!==false && toggle.isConnected!==false && dialog.parentNode===root)toggle.focus();});
        dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
        nav.addEventListener('click',event=>{if(event.target.closest?.('a'))dialog.close();});fragment.append(bar,dialog);
      }else fragment.append(nav);
      if (desktopControl) fragment.append(tooltip);
      let ended=false,timeout=null;
      const current=()=>!ended && this.#connected && this.isConnected!==false && this.#generation===generation && sheet.parentNode===root;
      const stylesReady=()=>{try{return Boolean(sheet.sheet) && globalThis.getComputedStyle(this).getPropertyValue('--cw-nav-stylesheet-ready').trim()==='1';}catch{return false;}};
      const cleanup=()=>{clearTimeout(timeout);sheet.removeEventListener('load',loaded);sheet.removeEventListener('error',unavailable);};
      const unavailable=()=>{if(!current())return;ended=true;cleanup();fragment.replaceChildren();statusCopy.textContent=words.unavailable;this.setAttribute('data-cw-navigation-state','error');};
      const reveal=()=>{
        if(!current() || !stylesReady())return;ended=true;cleanup();
        status.remove();
        root.append(fragment);
        if (sidebar) this.setAttribute('data-cw-navigation-mode', mode());
        this.setAttribute('data-cw-navigation-state','ready');
      };
      const loaded=()=>{if(!current())return;if(stylesReady())reveal();else unavailable();};
      this.#release=()=>{ended=true;cleanup();fragment.replaceChildren();};
      sheet.addEventListener('load',loaded);sheet.addEventListener('error',unavailable);
      if(this.#connected)timeout=setTimeout(unavailable,8000);
      // Install listeners before insertion: cached links can complete immediately.
      root.append(sheet,status);
      if(stylesReady())reveal();
    }
  }
  customElements.define(tagName,ConnectWunderNavigation);return ConnectWunderNavigation;
}
