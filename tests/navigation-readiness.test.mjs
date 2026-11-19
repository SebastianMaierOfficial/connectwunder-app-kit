import test from 'node:test';
import assert from 'node:assert/strict';
import {defineConnectWunderNavigation} from '../src/navigation.js';

// Controlled DOM/style/timer I/O around the actual exported custom-element class.
function withElement(run) {
  const keys=['document','location','customElements','HTMLElement','matchMedia','getComputedStyle','setTimeout','clearTimeout'];
  const saved=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  let mobile=false,cache='none',clock=0,timerId=0;
  const timers=new Map(),mediaListeners=new Set(),registry=new Map();
  const walk=node=>[node,...(node.children||[]).flatMap(walk)];
  class Element {
    constructor(tag='host') {
      this.tagName=tag;this.children=[];this.attrs=new Map();this.handlers=new Map();this.parentNode=null;this.open=false;this.mounted=false;
      if(tag==='link'){this.sheet=cache==='none'?null:{};this.applied=cache==='ready';}
    }
    get isConnected(){return this.tagName==='host'?this.mounted:this.tagName==='shadow'?Boolean(this.host?.isConnected):Boolean(this.parentNode?.isConnected);}
    setAttribute(key,value){this.attrs.set(key,String(value));}
    getAttribute(key){return this.attrs.get(key);}
    toggleAttribute(key,on){if(on)this.attrs.set(key,'');else this.attrs.delete(key);}
    addEventListener(type,callback){const callbacks=this.handlers.get(type)||new Set();callbacks.add(callback);this.handlers.set(type,callbacks);}
    removeEventListener(type,callback){this.handlers.get(type)?.delete(callback);}
    callbacks(type){return [...(this.handlers.get(type)||[])];}
    emit(type,event={}){for(const callback of this.callbacks(type))callback({target:this,...event});}
    append(...nodes){for(const node of nodes){if(node.tagName==='fragment'){this.append(...[...node.children]);}else{node.remove?.();node.parentNode=this;this.children.push(node);if(node.tagName==='link')node.listenersBeforeInsertion=node.callbacks('load').length>0 && node.callbacks('error').length>0;}}}
    remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}}
    replaceChildren(...nodes){for(const node of this.children)node.parentNode=null;this.children=[];this.append(...nodes);}
    attachShadow(){const root=new Element('shadow');root.host=this;this.shadowRoot=root;return root;}
    querySelector(tag){return walk(this).find(node=>node.tagName===tag)||null;}
    showModal(){assert.equal(this.isConnected,true);this.open=true;}
    close(){if(this.open){this.open=false;this.emit('close');}}
    focus(){this.focused=true;}
    set innerHTML(value){throw Error('Raw HTML is forbidden');}
  }
  const set=(key,value)=>Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  try {
    set('HTMLElement',Element);set('location',{origin:'https://sample-app.example.invalid'});
    set('document',{createElement:tag=>new Element(tag),createElementNS:(_ns,tag)=>new Element(tag),createTextNode:text=>({textContent:text}),createDocumentFragment:()=>new Element('fragment')});
    set('getComputedStyle',host=>({getPropertyValue:key=>key==='--cw-nav-stylesheet-ready' && host.shadowRoot.querySelector('link')?.applied?'1':''}));
    set('customElements',{get:key=>registry.get(key),define:(key,value)=>registry.set(key,value)});
    set('matchMedia',()=>({get matches(){return mobile;},addEventListener:(_event,callback)=>mediaListeners.add(callback),removeEventListener:(_event,callback)=>mediaListeners.delete(callback)}));
    set('setTimeout',(callback,delay)=>{const id=++timerId;timers.set(id,{callback,at:clock+delay});return id;});
    set('clearTimeout',id=>timers.delete(id));
    const Type=defineConnectWunderNavigation('readiness-navigation'),element=new Type();
    element.allowedOrigins=['https://sample-app.example.invalid','https://beta.example.invalid'];
    const model={presentation:'sidebar',locale:'de',workspaceName:'Private sample workspace',homeHref:'https://beta.example.invalid/app?workspaceId=sample',legal:{imprint:'https://beta.example.invalid/imprint',privacy:'https://beta.example.invalid/privacy'},items:[{id:'private',label:'Private sample destination',href:'https://beta.example.invalid/private',section:'primary',icon:'people'}]};
    const fixture={
      element,model,walk:()=>walk(element.shadowRoot),link:()=>element.shadowRoot.querySelector('link'),
      connect(){element.mounted=true;element.connectedCallback();},disconnect(){element.mounted=false;element.disconnectedCallback();},
      media(value){mobile=value;for(const callback of [...mediaListeners])callback();},cache(value){cache=value;},
      apply(link=fixture.link()){link.sheet={};link.applied=true;link.emit('load');},
      state:()=>element.getAttribute('data-cw-navigation-state'),
      advance(ms){clock+=ms;for(const[id,entry]of[...timers])if(entry.at<=clock){timers.delete(id);entry.callback();}},
      timerCount:()=>timers.size,
      privateCount:()=>walk(element.shadowRoot).filter(node=>node.textContent==='Private sample destination'||node.textContent==='Private sample workspace').length,
    };
    run(fixture);
    fixture.disconnect();assert.equal(timers.size,0);
  } finally {for(const[key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
}

function assertPlain(f) {
  assert.equal(f.privateCount(),0);
  assert.equal(f.walk().some(node=>['nav','svg','img','dialog'].includes(node.tagName)),false);
  assert.equal(f.walk().find(node=>node.tagName==='a').href,f.model.homeHref);
  assert.ok(f.walk().some(node=>node.textContent==='Imprint'));
  assert.ok(f.walk().some(node=>node.textContent==='Privacy'));
  assert.equal(f.link().parentNode,f.element.shadowRoot);
}

test('native stylesheet gate needs applied sentinel, retains safe text on phantom sheet/error, and attaches once on valid load/cache',()=>withElement(f=>{
  f.element.model=f.model;assert.equal(f.state(),'loading');assertPlain(f);
  const beforeConnect=f.link(),beforeConnectLoad=beforeConnect.callbacks('load')[0];beforeConnect.sheet={};beforeConnect.applied=true;beforeConnectLoad();assertPlain(f);
  f.connect();assert.equal(f.state(),'loading');assertPlain(f);assert.equal(f.link().listenersBeforeInsertion,true);
  const failed=f.link(),lateLoad=failed.callbacks('load')[0];failed.sheet={};assertPlain(f);
  failed.emit('load');assert.equal(f.state(),'error');assertPlain(f);assert.equal(f.timerCount(),0);
  failed.applied=true;lateLoad();failed.emit('load');assert.equal(f.state(),'error');assertPlain(f);
  f.element.model=f.model;const current=f.link();assert.notEqual(current,failed);f.apply();
  assert.equal(f.state(),'ready');assert.equal(f.privateCount(),2);assert.equal(f.walk().filter(node=>node.tagName==='nav').length,1);
  assert.equal(current.parentNode,f.element.shadowRoot);assert.equal(current.callbacks('load').length,0);assert.equal(f.timerCount(),0);
  current.emit('load');assert.equal(f.walk().filter(node=>node.tagName==='nav').length,1);
  f.cache('ready');f.element.model=f.model;assert.equal(f.state(),'ready');assert.equal(f.link().listenersBeforeInsertion,true);assert.equal(f.privateCount(),2);assert.equal(f.timerCount(),0);
}));

test('native gate discards replaced, media, cleared and disconnected generations without reviving old navigation',()=>withElement(f=>{
  f.element.model=f.model;f.connect();
  const old=f.link(),oldLoad=old.callbacks('load')[0];
  const replacement={...f.model,workspaceName:'Current sample workspace',items:[{...f.model.items[0],id:'current',label:'Current sample destination'}]};
  f.element.model=replacement;const current=f.link();old.sheet={};old.applied=true;oldLoad();assert.equal(f.state(),'loading');assert.equal(f.privateCount(),0);
  f.apply(current);assert.equal(f.state(),'ready');assert.equal(f.walk().some(node=>node.textContent==='Current sample destination'),true);
  const clear={...f.model,workspaceName:'Dein Workspace',items:[]};f.element.model=clear;const pending=f.link(),staleMedia=pending.callbacks('load')[0];
  assert.equal(f.privateCount(),0);assert.equal(f.walk().some(node=>node.textContent==='Current sample destination'),false);
  f.media(true);const mobileLink=f.link();pending.sheet={};pending.applied=true;staleMedia();assert.equal(f.state(),'loading');assert.equal(f.walk().some(node=>node.tagName==='dialog'),false);
  f.apply(mobileLink);assert.equal(f.state(),'ready');const dialog=f.element.shadowRoot.querySelector('dialog'),toggle=f.walk().find(node=>node.className==='menu-toggle');
  toggle.emit('click');assert.equal(dialog.open,true);dialog.close();assert.equal(toggle.focused,true);
  toggle.emit('click');toggle.focused=false;
  const staleToggle=toggle.callbacks('click')[0];f.element.model=clear;assert.equal(toggle.focused,false);staleToggle();assert.equal(dialog.open,false);
  const disconnectedLink=f.link(),disconnectedLoad=disconnectedLink.callbacks('load')[0],timer=f.timerCount();assert.equal(timer,1);
  f.disconnect();assert.equal(f.timerCount(),0);assert.equal(f.walk().length,1);assert.equal(f.state(),'loading');
  disconnectedLink.sheet={};disconnectedLink.applied=true;disconnectedLoad();assert.equal(f.walk().length,1);
  f.connect();assert.equal(f.state(),'loading');assert.notEqual(f.link(),disconnectedLink);f.apply();assert.equal(f.state(),'ready');assert.equal(f.privateCount(),0);
}));

test('native gate has a terminal eight-second deadline and allows only a new current render to recover',()=>withElement(f=>{
  f.element.model={...f.model,locale:'en'};f.connect();const timedOut=f.link(),late=timedOut.callbacks('load')[0];
  f.advance(7999);assert.equal(f.state(),'loading');assertPlain(f);
  f.advance(1);assert.equal(f.state(),'error');assert.ok(f.walk().some(node=>node.textContent?.startsWith('Navigation is currently unavailable.')));assertPlain(f);
  assert.equal(f.timerCount(),0);timedOut.sheet={};timedOut.applied=true;late();assert.equal(f.state(),'error');assertPlain(f);
  f.element.model=f.model;const failed=f.link(),lateError=failed.callbacks('load')[0];failed.sheet={};failed.emit('error');assert.equal(f.state(),'error');assertPlain(f);assert.equal(f.timerCount(),0);
  failed.applied=true;lateError();assert.equal(f.state(),'error');assertPlain(f);
  f.cache('phantom');f.element.model=f.model;assert.equal(Boolean(f.link().sheet),true);assert.equal(f.state(),'loading');assertPlain(f);
  f.cache('ready');f.element.model=f.model;assert.equal(f.state(),'ready');assert.equal(f.privateCount(),2);assert.equal(f.timerCount(),0);
}));
