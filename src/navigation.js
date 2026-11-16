/** Optional native navigation. Input is a render model, not the provider wire DTO. */
export function normalizeNavigation(model, allowedOrigins, baseOrigin) {
  if (!model || !Array.isArray(model.items) || model.items.length > 60) throw new TypeError('Navigation model is invalid');
  const origins = new Set(allowedOrigins.map(value => {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) throw new TypeError('Navigation origin is invalid');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new TypeError('Navigation origin is invalid');
    return url.origin;
  }));
  const label = (value, maxLength = 160) => {
    if (typeof value !== 'string' || !value.trim() || value.length > maxLength || /[\u0000-\u001f]/u.test(value)) throw new TypeError('Navigation label is invalid');
    return value.trim();
  };
  const link = value => {
    const url = new URL(value, baseOrigin);
    if (!origins.has(url.origin) || url.username || url.password) throw new TypeError('Navigation link is not allowed');
    if ([...url.searchParams.keys()].some(key => /^(?:access_token|refresh_token|token|code|code_verifier)$/iu.test(key))) throw new TypeError('Navigation link must not contain credentials');
    return url.href;
  };
  const ids = new Set();
  return Object.freeze({
    label: label(model.label || 'Workspace-Navigation'),
    workspaceName: label(model.workspaceName, 200),
    homeHref: link(model.homeHref),
    homeLabel: label(model.homeLabel || 'ConnectWunder öffnen'),
    legal: model.legal ? Object.freeze({ imprint: link(model.legal.imprint), privacy: link(model.legal.privacy) }) : null,
    emptyLabel: label(model.emptyLabel || 'Keine weiteren Anwendungen verfügbar.'),
    items: Object.freeze(model.items.map(item => {
      const id = label(item.id);
      if (ids.has(id)) throw new TypeError('Navigation IDs must be unique');
      ids.add(id);
      return Object.freeze({ id, label: label(item.label), href: link(item.href), current: item.current === true });
    })),
  });
}

/** Call in the browser. Importing this module on a server has no DOM side effect. */
export function defineConnectWunderNavigation(tagName = 'connectwunder-nav') {
  if (!globalThis.customElements || !globalThis.HTMLElement) throw new TypeError('A browser is required');
  if (customElements.get(tagName)) return customElements.get(tagName);
  class ConnectWunderNavigation extends HTMLElement {
    #model = null;
    #origins = [location.origin];
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    set allowedOrigins(origins) {
      if (!Array.isArray(origins) || origins.length > 40) throw new TypeError('Navigation origins are invalid');
      const next = this.#model ? normalizeNavigation(this.#model, origins, location.origin) : null;
      this.#origins = [...origins];
      if (next) { this.#model = next; this.#render(); }
    }
    get allowedOrigins() { return [...this.#origins]; }
    set model(value) {
      this.#model = normalizeNavigation(value, this.#origins, location.origin);
      this.#render();
    }
    get model() { return this.#model; }
    connectedCallback() { this.#render(); }
    #render() {
      const root = this.shadowRoot;
      root.replaceChildren();
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('./navigation.css', import.meta.url).href;
      root.append(stylesheet);
      if (!this.#model) return;
      const model = this.#model;
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', model.label);
      nav.setAttribute('part', 'navigation');
      const home = document.createElement('a');
      home.className = 'home';
      home.href = model.homeHref;
      home.textContent = model.homeLabel;
      home.setAttribute('part', 'home-link');
      nav.append(home);
      const name = document.createElement('p');
      name.className = 'workspace';
      name.textContent = model.workspaceName;
      nav.append(name);
      if (!model.items.length) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = model.emptyLabel;
        nav.append(empty);
      } else {
        const list = document.createElement('ul');
        for (const item of model.items) {
          const row = document.createElement('li');
          const anchor = document.createElement('a');
          anchor.href = item.href;
          anchor.textContent = item.label;
          anchor.setAttribute('part', 'item-link');
          if (item.current) anchor.setAttribute('aria-current', 'page');
          row.append(anchor);
          list.append(row);
        }
        nav.append(list);
      }
      if (model.legal) {
        const footer = document.createElement('div');
        footer.className = 'legal';
        footer.setAttribute('part', 'legal');
        for (const [key, title] of [['imprint', 'Imprint'], ['privacy', 'Privacy']]) {
          const legalLink = document.createElement('a');
          legalLink.href = model.legal[key];
          legalLink.textContent = title;
          footer.append(legalLink);
        }
        nav.append(footer);
      }
      root.append(nav);
    }
  }
  customElements.define(tagName, ConnectWunderNavigation);
  return ConnectWunderNavigation;
}
