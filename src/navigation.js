/** Optional native navigation. Input is a render model, not authorization. */
export const navigationIcons = Object.freeze(['dashboard','inbox','todos','people','companies','events','boards','documents','app','team','settings','news','help','code','book','area','account','notifications','workspace','billing','integrations','api-key','automation','history']);
const sections = ['dashboards','primary','settings','developers'];
const copy = {
  de: { menu:'Navigation öffnen',close:'Navigation schließen',dashboards:'Dashboards',primary:'Workspace',settings:'Einstellungen',developers:'Entwickler',home:'ConnectWunder öffnen',overview:'Übersicht',empty:'Verbinde dich mit ConnectWunder, um deine Navigation zu laden.' },
  en: { menu:'Open navigation',close:'Close navigation',dashboards:'Dashboards',primary:'Workspace',settings:'Settings',developers:'Developers',home:'Open ConnectWunder',overview:'Overview',empty:'Connect to ConnectWunder to load your navigation.' },
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

// Newly authored geometric icons. No provider-supplied SVG, HTML or CSS is accepted.
const paths = {
 dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 inbox:'M4 4h16l2 13v3H2v-3z M2 15h6l2 3h4l2-3h6',
 todos:'m3 6 2 2 4-5 M12 6h9 M3 13l2 2 4-5 M12 13h9 M12 20h9',
 people:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M19 14a4 4 0 0 1 3 4v3 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 3a4 4 0 0 1 0 8',
 companies:'M4 21V4h10v17 M14 10h6v11 M8 8h2 M8 12h2 M8 16h2 M2 21h20',
 events:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16 M8 14h2 M14 14h2',
 boards:'M3 4h18v16H3z M9 4v16 M15 4v16 M5 8h2 M11 8h2 M17 8h2',
 documents:'M5 2h9l5 5v15H5z M14 2v6h5 M8 12h8 M8 16h8',
 app:'M4 3h16v18H4z M4 8h16 M8 5h1 M12 5h1',
 team:'M3 20v-3h18v3 M8 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M3 10h2 M19 10h2',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
 news:'M3 4h18v17H3z M7 8h10 M7 12h4 M7 16h10',
 help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 18h.01 M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20',
 code:'m8 6-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18',
 book:'M12 5C9 2 5 2 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-3-1-7-1-10 2z M12 5v16',
 area:'M3 3h18v18H3z M3 9h18 M9 9v12',
 account:'M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3',
 notifications:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
 workspace:'M3 7h18v14H3z M8 7V3h8v4 M3 12h18',
 billing:'M3 5h18v14H3z M3 10h18 M6 15h4',
 integrations:'M8 3v5 M16 3v5 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4',
 'api-key':'M8 4a5 5 0 1 0 0 10 5 5 0 1 0 0-10 M12 12l9 9 M17 17l3-3',
 automation:'m13 2-9 12h7l-1 8 10-13h-7z',
 history:'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v6l4 2',
};
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[name] || paths.app);svg.append(path);return svg;
}
/** Call in the browser. Server imports have no DOM side effect. */
export function defineConnectWunderNavigation(tagName = 'connectwunder-nav') {
  if (!globalThis.customElements || !globalThis.HTMLElement) throw new TypeError('A browser is required');
  if (customElements.get(tagName)) return customElements.get(tagName);
  class ConnectWunderNavigation extends HTMLElement {
    #model = null; #origins = [location.origin]; #media = null; #expanded = new Map(); #selection = null; #generation = 0;
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
    connectedCallback(){this.#media=globalThis.matchMedia?.('(max-width: 48rem)') || null;this.#media?.addEventListener('change',this.#resize);this.#render();}
    disconnectedCallback(){this.#media?.removeEventListener('change',this.#resize);this.shadowRoot.querySelector('dialog')?.close();}
    #render(){
      const generation=++this.#generation;
      const root=this.shadowRoot;root.querySelector('dialog')?.close();root.replaceChildren();
      const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./navigation.css',import.meta.url).href;root.append(sheet);
      if(!this.#model)return;
      const model=this.#model,words=copy[model.locale],sidebar=model.presentation==='sidebar';
      this.toggleAttribute('sidebar',sidebar);
      const nav=document.createElement('nav');nav.setAttribute('aria-label',model.label);nav.setAttribute('part','navigation');
      const home=document.createElement('a');home.className='home';home.href=model.homeHref;home.setAttribute('part','home-link');
      if(sidebar){const brand=document.createElement('span');brand.className='brand';brand.textContent='ConnectWunder';home.append(icon('workspace'),brand);home.setAttribute('aria-label',model.homeLabel);}else home.textContent=model.homeLabel;
      nav.append(home);
      const workspace=document.createElement('p');workspace.className='workspace';workspace.textContent=model.workspaceName;nav.append(workspace);
      const body=document.createElement('div');body.className='links';
      if(!model.items.length){const empty=document.createElement('p');empty.className='empty';empty.textContent=model.emptyLabel;body.append(empty);}
      const addItems=(items,parent)=>{const list=document.createElement('ul');for(const item of items){
        const row=document.createElement('li'),a=document.createElement('a');a.href=item.href;a.setAttribute('part','item-link');
        if(sidebar)a.append(icon(item.icon));const text=document.createElement('span');text.textContent=sidebar && item.section==='settings' && item.id==='connectwunder-settings' ? words.overview : item.label;a.append(text);
        if(item.current)a.setAttribute('aria-current','page');row.append(a);list.append(row);
      }parent.append(list);};
      if(sidebar){const emitted=new Set();let primary=[];
        const flushPrimary=()=>{if(primary.length)addItems(primary,body);primary=[];};
        for(const next of model.items){const section=next.section || 'primary';
        if(section==='primary'){primary.push(next);continue;}
        if(emitted.has(section))continue;
        flushPrimary();emitted.add(section);
        const items=model.items.filter(item=>(item.section || 'primary')===section);
        const group=document.createElement('details');group.className='group';group.setAttribute('data-section',section);
        group.open=this.#expanded.has(section) ? this.#expanded.get(section) : items.some(item=>item.current);
        const summary=document.createElement('summary');if(items.some(item=>item.current))summary.className='current';summary.append(icon(section==='dashboards'?'dashboard':section==='settings'?'settings':'code'));
        const title=document.createElement('span');title.textContent=words[section];summary.append(title);
        const chevron=document.createElementNS('http://www.w3.org/2000/svg','svg');chevron.setAttribute('viewBox','0 0 24 24');chevron.setAttribute('aria-hidden','true');chevron.setAttribute('class','chevron');
        const chevronPath=document.createElementNS('http://www.w3.org/2000/svg','path');chevronPath.setAttribute('d','m9 5 7 7-7 7');chevronPath.setAttribute('fill','none');chevronPath.setAttribute('stroke','currentColor');chevronPath.setAttribute('stroke-width','1.6');chevronPath.setAttribute('stroke-linecap','round');chevronPath.setAttribute('stroke-linejoin','round');chevron.append(chevronPath);summary.append(chevron);
        group.append(summary);addItems(items,group);
        group.addEventListener('toggle',()=>{if(this.#generation===generation)this.#expanded.set(section,group.open);});body.append(group);
      }flushPrimary();}else addItems(model.items,body);
      nav.append(body);
      if(model.legal){const footer=document.createElement('div');footer.className='legal';footer.setAttribute('part','legal');for(const [key,title]of[['imprint','Imprint'],['privacy','Privacy']]){const a=document.createElement('a');a.href=model.legal[key];a.textContent=title;footer.append(a);}nav.append(footer);}
      if(sidebar && this.#media?.matches){
        const toggle=document.createElement('button');toggle.type='button';toggle.className='menu-toggle';toggle.setAttribute('aria-label',words.menu);toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-haspopup','dialog');toggle.append(icon('boards'),document.createTextNode('ConnectWunder'));
        const dialog=document.createElement('dialog');dialog.setAttribute('aria-label',model.label);
        const close=document.createElement('button');close.type='button';close.className='close';close.textContent=words.close;
        close.addEventListener('click',()=>dialog.close());dialog.append(close,nav);
        toggle.addEventListener('click',()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');});
        dialog.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');toggle.focus();});
        dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
        nav.addEventListener('click',event=>{if(event.target.closest?.('a'))dialog.close();});root.append(toggle,dialog);
      }else root.append(nav);
    }
  }
  customElements.define(tagName,ConnectWunderNavigation);return ConnectWunderNavigation;
}
