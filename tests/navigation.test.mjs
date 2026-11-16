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
