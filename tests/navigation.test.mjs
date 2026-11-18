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
 const saved=new Map(['document','location','customElements','HTMLElement','matchMedia'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Element {
  constructor(tag='host'){this.tagName=tag;this.children=[];this.attrs=new Map();this.handlers=new Map();this.open=false;}
  setAttribute(k,v){this.attrs.set(k,String(v));} getAttribute(k){return this.attrs.get(k);} toggleAttribute(k,on){if(on)this.attrs.set(k,'');else this.attrs.delete(k);}
  append(...children){this.children.push(...children);} replaceChildren(...children){this.children=children;} attachShadow(){this.shadowRoot=new Element('shadow');return this.shadowRoot;}
  addEventListener(k,fn){this.handlers.set(k,fn);} querySelector(tag){return walk(this).find(n=>n.tagName===tag)||null;}
  showModal(){this.open=true;} close(){if(this.open){this.open=false;this.handlers.get('close')?.();}} focus(){this.focused=true;}
  set innerHTML(value){throw Error('HTML parsing is forbidden in this renderer');}
 }
 const walk=node=>[node,...(node.children||[]).flatMap(walk)];let mobile=false;const registry=new Map();
 try{
  for(const [key,value] of Object.entries({HTMLElement:Element,location:{origin},matchMedia:()=>({matches:mobile,addEventListener(){},removeEventListener(){}}),customElements:{get:k=>registry.get(k),define:(k,v)=>registry.set(k,v)},document:{createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t),createTextNode:text=>({textContent:text})}}))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
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
  element.model={...model,presentation:'sidebar',items:[]};assert.equal(walk(element.shadowRoot).some(n=>n.textContent===label),false);element.disconnectedCallback();
 }finally{for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
