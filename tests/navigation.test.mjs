import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNavigation, defineConnectWunderNavigation } from '../src/navigation.js';
const origin='https://sample-app.example.invalid';
const provider='https://beta.example.invalid';
const model={workspaceName:'Sample workspace',homeHref:provider+'/app',items:[{id:'sample-board',label:'Sample board',href:provider+'/app/boards/sample-board'}]};
test('headless render model requires explicit allowed origins and stays immutable',()=>{
 const normalized=normalizeNavigation(model,[origin,provider],origin);
 assert.equal(normalized.items[0].label,'Sample board');
 assert.equal(Object.isFrozen(normalized.items[0]),true);
 assert.throws(()=>defineConnectWunderNavigation(),/browser/u);
});
test('navigation rejects unsafe protocols, credentials, duplicate IDs and token-bearing links',()=>{
 for(const href of ['javascript:alert(1)','https://other.example.invalid/','https://name:password@beta.example.invalid/app',provider+'/app?access_token=synthetic']){
  assert.throws(()=>normalizeNavigation({...model,homeHref:href},[origin,provider],origin));
 }
 assert.throws(()=>normalizeNavigation({...model,items:[model.items[0],model.items[0]]},[origin,provider],origin));
});

test('workspace names accept the provider boundary without widening ordinary item labels',()=>{
 for(const length of [170,200]){
  const workspaceName='Sample workspace '.padEnd(length,'x');
  const result=normalizeNavigation({...model,workspaceName},[origin,provider],origin);
  assert.equal(result.workspaceName,workspaceName);
  assert.equal(result.workspaceName.length,length);
 }
 assert.throws(()=>normalizeNavigation({...model,workspaceName:'x'.repeat(201)},[origin,provider],origin));
 assert.throws(()=>normalizeNavigation({...model,items:[{...model.items[0],label:'x'.repeat(161)}]},[origin,provider],origin));
});
test('canonical workspace-bound return links remain intact and are not interpreted as authority',()=>{
 const resolver=provider+'/app/applications/return?workspaceId=synthetic-workspace&destination=boards%2Fsynthetic-board';
 const result=normalizeNavigation({...model,homeHref:resolver,items:[{...model.items[0],href:resolver}]},[origin,provider],origin);
 assert.equal(result.homeHref,resolver);
 assert.equal(result.items[0].href,resolver);
});

test('additive sidebar preserves authorized sections, current app and opaque URLs without changing flat bounds',()=>{
 const href=provider+'/app/applications/return?workspaceId=sample&destination=people&locale=de';
 const result=normalizeNavigation({...model,presentation:'sidebar',locale:'en',activeId:'connectwunder-app:sample',items:[
  {id:'people',label:'Sample people',href,section:'primary',icon:'people'},
  {id:'connectwunder-app:sample',label:'Sample app',href,section:'dashboards',icon:'app'},
  {id:'settings',label:'Sample settings',href,section:'settings',icon:'settings'},
 ]},[origin,provider],origin);
 assert.equal(result.presentation,'sidebar');assert.equal(result.items[0].href,href);assert.equal(result.items[1].current,true);assert.equal(result.items[0].current,false);
 assert.equal(Object.isFrozen(result.items),true);assert.equal(Object.isFrozen(result.items[1]),true);
 const items=Array.from({length:200},(_,i)=>({id:'sample-'+i,label:'😀'.repeat(200),href,section:'dashboards',icon:'area'}));
 assert.equal(normalizeNavigation({...model,presentation:'sidebar',items},[origin,provider],origin).items.length,200);
 assert.throws(()=>normalizeNavigation({...model,presentation:'sidebar',items:[...items,{...items[0],id:'extra'}]},[origin,provider],origin));
 assert.throws(()=>normalizeNavigation({...model,items:items.slice(0,61)},[origin,provider],origin));
});
test('sidebar rejects unadvertised structure and missing or oversized URLs; lower-trust labels remain text',()=>{
 const item={id:'sample',label:'<img src=x onerror="sample()">',href:provider+'/app',section:'primary',icon:'people'};
 assert.equal(normalizeNavigation({...model,presentation:'sidebar',items:[item]},[origin,provider],origin).items[0].label,item.label);
 for(const patch of [{section:'hidden'},{icon:'<svg onload=sample()>'},{label:'x'.repeat(201)},{id:'x'.repeat(201)},{href:undefined},{href:''},{href:provider+'/'+'x'.repeat(2049)}]){
  assert.throws(()=>normalizeNavigation({...model,presentation:'sidebar',items:[{...item,...patch}]},[origin,provider],origin));
 }
 assert.throws(()=>normalizeNavigation({...model,locale:'xx'},[origin,provider],origin));
 assert.throws(()=>normalizeNavigation({...model,presentation:'grid'},[origin,provider],origin));
});

test('actual element renders sections, active links and hostile labels with DOM text; mobile controls own their dialog',()=>{
 const saved=new Map(['document','location','customElements','HTMLElement','matchMedia','FontFace','getComputedStyle'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Element {
  constructor(tag='host'){this.tagName=tag;this.children=[];this.attrs=new Map();this.handlers=new Map();this.open=false;if(tag==='link')this.sheet={};}
  setAttribute(k,v){this.attrs.set(k,String(v));} getAttribute(k){return this.attrs.get(k);} toggleAttribute(k,on){if(on)this.attrs.set(k,'');else this.attrs.delete(k);}
  append(...children){for(const child of children){if(child.tagName==='fragment'){this.append(...child.children);child.children=[];}else{child.remove?.();child.parentNode=this;this.children.push(child);}}} replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children);} remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}} attachShadow(){this.shadowRoot=new Element('shadow');return this.shadowRoot;}
  addEventListener(k,fn){this.handlers.set(k,fn);} removeEventListener(k,fn){if(this.handlers.get(k)===fn)this.handlers.delete(k);} querySelector(tag){return walk(this).find(n=>n.tagName===tag)||null;}
  showModal(){this.open=true;} close(){if(this.open){this.open=false;this.handlers.get('close')?.();}} focus(){this.focused=true;}
  set innerHTML(value){throw Error('HTML parsing is forbidden in this renderer');}
 }
 const walk=node=>[node,...(node.children||[]).flatMap(walk)];let mobile=false;const registry=new Map();
 try{
  for(const [key,value] of Object.entries({getComputedStyle:()=>({getPropertyValue:key=>key==='--cw-nav-stylesheet-ready'?'1':''}),HTMLElement:Element,location:{origin},matchMedia:()=>({matches:mobile,addEventListener(){},removeEventListener(){}}),customElements:{get:k=>registry.get(k),define:(k,v)=>registry.set(k,v)},document:{createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>new Element('fragment')}}))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  const Type=defineConnectWunderNavigation('sample-navigation');const element=new Type();element.allowedOrigins=[origin,provider];
  const label='<img src=x onerror="sample()">';
  element.model={...model,presentation:'sidebar',activeId:'sample',legal:{imprint:provider+'/imprint',privacy:provider+'/privacy'},items:[{id:'sample',label,href:provider+'/app?workspaceId=sample',section:'dashboards',icon:'app'},{id:'people',label:'Sample people',href:provider+'/people',section:'primary',icon:'people'},{id:'connectwunder-settings',label:'Einstellungen',href:provider+'/settings',section:'settings',icon:'settings'},{id:'help',label:'Sample help',href:provider+'/help',section:'primary',icon:'help'},{id:'sample-api',label:'Sample API',href:provider+'/api',section:'developers',icon:'code'}]};element.connectedCallback();
  const nodes=walk(element.shadowRoot);assert.equal(nodes.filter(n=>n.tagName==='img').length,0);assert.ok(nodes.some(n=>n.textContent===label));assert.equal(nodes.filter(n=>n.attrs?.get('aria-current')==='page').length,1);assert.equal(nodes.filter(n=>n.tagName==='details').length,3);assert.equal(nodes.some(n=>n.tagName==='h2'),false);assert.ok(nodes.some(n=>n.textContent==='Privacy'));
  const order=nodes.find(n=>n.className==='links').children.map(n=>n.tagName==='details'?n.getAttribute('data-section'):n.children[0].children[0].href);assert.deepEqual(order,['dashboards',provider+'/people','settings',provider+'/help','developers']);
  const group=section=>walk(element.shadowRoot).find(n=>n.tagName==='details'&&n.getAttribute('data-section')===section);
  assert.equal(group('dashboards').open,true);assert.equal(group('settings').open,false);assert.equal(group('developers').open,false);
  assert.equal(nodes.filter(n=>n.textContent==='Einstellungen').length,1);assert.ok(nodes.some(n=>n.textContent==='Übersicht'));
  group('settings').open=true;group('settings').handlers.get('toggle')();group('dashboards').open=false;group('dashboards').handlers.get('toggle')();
  element.model=element.model;assert.equal(group('settings').open,true);assert.equal(group('dashboards').open,false);
  const oldGroup=group('settings');element.model=element.model;oldGroup.open=false;oldGroup.handlers.get('toggle')();element.model=element.model;assert.equal(group('settings').open,true);
  mobile=true;element.disconnectedCallback();element.connectedCallback();assert.equal(group('settings').open,true);const dialog=element.shadowRoot.querySelector('dialog');assert.ok(dialog);const toggle=walk(element.shadowRoot).find(n=>n.className==='menu-toggle');toggle.handlers.get('click')();assert.equal(dialog.open,true);assert.equal(toggle.getAttribute('aria-expanded'),'true');dialog.close();assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(toggle.focused,true);
  element.model={...model,presentation:'sidebar',items:[]};assert.equal(walk(element.shadowRoot).some(n=>n.textContent===label),false);
  // The only images are fixed public marks at supported Core origins, never label HTML or arbitrary provider assets.
  const core='https://beta.connectwunder.com',other='https://other-provider.example.invalid';
  element.allowedOrigins=[origin,provider,core,other];
  const brandedModel={...model,presentation:'sidebar',homeHref:core+'/app/applications/return?workspaceId=sample&destination=people',items:[{id:'branded',label,href:provider+'/app',section:'primary',icon:'people'}]};
  element.model=brandedModel;
  const brandedNodes=walk(element.shadowRoot),images=brandedNodes.filter(n=>n.tagName==='img');
  assert.equal(images.length,2);assert.ok(brandedNodes.some(n=>n.textContent===label));
  assert.equal(brandedNodes.filter(n=>n.className==='navigation-footer').length,1);
  assert.equal(brandedNodes.find(n=>n.className==='workspace').title,model.workspaceName);
  for(const image of images){assert.equal(image.src,core+'/brand/connectwunder-mark.png');assert.equal(image.alt,'');assert.equal(image.referrerPolicy,'no-referrer');assert.equal(image.getAttribute('width'),'24');assert.equal(image.getAttribute('height'),'24');image.handlers.get('error')();assert.equal(image.hidden,true);}
  assert.equal(brandedNodes.filter(n=>n.className==='home'&&n.tagName==='a').length,1);
  assert.equal(brandedNodes.filter(n=>n.className==='home'&&n.tagName==='div').length,1);
  assert.equal(brandedNodes.find(n=>n.className==='home'&&n.tagName==='div').getAttribute('aria-label'),undefined);
  assert.equal(brandedNodes.find(n=>n.className==='home'&&n.tagName==='a').href,brandedModel.homeHref);
  element.model={...brandedModel,homeHref:other+'/app'};
  assert.equal(walk(element.shadowRoot).filter(n=>n.tagName==='img').length,0);
  // Font registration is document-scoped and immediate; unresolved font loads never gate rendering.
  const createdFonts=[];let explicitLoads=0;
  class PublicFontFace { constructor(family,source,descriptors){this.family=family;this.source=source;this.descriptors=descriptors;this.loaded=new Promise(()=>{});createdFonts.push(this);}load(){explicitLoads+=1;throw Error('Rendering must not explicitly wait for font loading');} }
  Object.defineProperty(globalThis,'FontFace',{configurable:true,writable:true,value:PublicFontFace});
  document.fonts=new Set();element.model=brandedModel;
  assert.equal(document.fonts.size,7);assert.equal(explicitLoads,0);assert.equal(walk(element.shadowRoot).some(n=>n.textContent===label),true);
  assert.equal(new Set(createdFonts.map(f=>f.source)).size,7);
  for(const face of createdFonts){assert.equal(face.family,'Inter');assert.match(face.source,/^url\("https:\/\/fonts\.gstatic\.com\/s\/inter\/v20\/[A-Za-z0-9_-]+\.woff2"\)$/u);assert.equal(face.descriptors.weight,'100 900');assert.equal(face.descriptors.display,'swap');assert.match(face.descriptors.unicodeRange,/^U\+/u);}
  element.model=element.model;mobile=false;element.disconnectedCallback();element.connectedCallback();assert.equal(createdFonts.length,7);
  const originalDocument=globalThis.document,alreadyDefined={...originalDocument,fonts:new Set([{family:'"Inter"'}])};
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:alreadyDefined});
  element.model=brandedModel;assert.equal(alreadyDefined.fonts.size,1);assert.equal(createdFonts.length,7);
  const blockedFonts={...originalDocument,fonts:{[Symbol.iterator]:function*(){},add(){throw Error('Font installation unavailable');}}};
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:blockedFonts});
  assert.doesNotThrow(()=>{element.model=brandedModel;});assert.ok(walk(element.shadowRoot).some(n=>n.textContent===label));
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:originalDocument});
  element.model={...model,presentation:'sidebar',items:[]};
  assert.equal(walk(element.shadowRoot).some(n=>n.textContent===label),false);element.disconnectedCallback();
 }finally{for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
