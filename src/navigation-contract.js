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
export const navigationContractVersion = '0.2.4-core.1';

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

export const navigationIcons = Object.freeze(/** @type {(keyof typeof modelIconNodes)[]} */ (Object.keys(modelIconNodes)));
export const navigationIconNodes = {
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

export const navigationSvg = Object.freeze({
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
export function navigationItemIcon({id, icon}) {
  return Object.hasOwn(itemIcons, id)
    ? /** @type {keyof typeof navigationIconNodes} */ (itemIcons[/** @type {keyof typeof itemIcons} */ (id)])
    : icon || 'app';
}

export const navigationGroupIcons = /** @type {const} */ ({
  dashboards: 'dashboard', settings: 'settings', developers: 'code',
});

export const navigationTokens = Object.freeze({
  width: '16rem', drawerWidth: '18rem', railWidth: '4.125rem', railPanelWidth: '3rem',
  breakpoint: '48rem', rowHeight: '2rem', subrowHeight: '1.75rem', iconSize: '1rem',
  inset: '.5rem', radius: '10px', flyoutWidth: '16rem', flyoutGap: 10,
  background: '230.0 60.0% 98.0%', foreground: '215.0 18.0% 39.2%', primary: '243.4 75.4% 58.6%',
  active: '225.9 100.0% 96.7%', activeForeground: '244.5 57.9% 50.6%', border: '213.3 34.6% 89.8%',
});

export const navigationCopy = Object.freeze({
  de: {expand: 'Navigation ausklappen', collapse: 'Navigation einklappen'},
  en: {expand: 'Expand navigation', collapse: 'Collapse navigation'},
});

/** @param {boolean} mobile @param {boolean} expanded */
export function navigationMode(mobile, expanded) {
  return mobile ? 'drawer' : expanded ? 'expanded' : 'compact';
}

const preferenceKey = 'sidebar_state';

/** @param {Pick<Document, "cookie">} document */
export function readNavigationExpanded(document) {
  try {
    return !document.cookie?.split('; ').includes(preferenceKey + '=false');
  } catch {
    return true;
  }
}

/** @param {Pick<Document, "cookie">} document @param {boolean} expanded */
export function writeNavigationExpanded(document, expanded) {
  try {
    document.cookie = preferenceKey + '=' + expanded + '; path=/; max-age=604800; SameSite=Lax';
  } catch { /* The control remains usable when preference storage is unavailable. */ }
}
