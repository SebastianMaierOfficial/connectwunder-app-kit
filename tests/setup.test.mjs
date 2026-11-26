import test from 'node:test';
import assert from 'node:assert/strict';
import { validateApplicationManifest, configurationFromRegistration } from '../src/setup.js';
const manifest={name:'Sample board overview',mode:'managed',origin:'https://sample-app.example.invalid',boardIds:['synthetic-board'],visibility:'workspace'};
const registration={application:{appId:'synthetic-app',mode:'managed',origin:manifest.origin},oauth:{clientId:'cw_wa_beta_synthetic',issuer:'https://auth.example.invalid',resource:'https://api.example.invalid/api/workspace-apps/v1',redirectUri:manifest.origin+'/auth/connectwunder/callback',scopes:['apps.identity.read','apps.navigation.read','apps.boards.read']}};
const metadata={issuer:'https://auth.example.invalid',authorization_endpoint:'https://auth.example.invalid/oauth/authorize',token_endpoint:'https://auth.example.invalid/oauth/token',revocation_endpoint:'https://auth.example.invalid/oauth/revoke'};
test('manifest planning stays private and supplies the correct managed launch/callback defaults',()=>{
 const value=validateApplicationManifest(manifest);
 assert.equal(value.entryPath,'/auth/connectwunder/launch');
 assert.equal(value.callbackUrl,manifest.origin+'/auth/connectwunder/callback');
 assert.deepEqual(value.boardIds,['synthetic-board']);
 assert.throws(()=>validateApplicationManifest({...manifest,mode:'external'}));
 assert.throws(()=>validateApplicationManifest({...manifest,visibility:'selected'}));
 assert.throws(()=>validateApplicationManifest({...manifest,origin:'https://sample-app.example.invalid/path'}));
});
test('configuration maps only server-confirmed registration and matching issuer discovery',()=>{
 const config=configurationFromRegistration(registration,manifest,metadata);
 assert.equal(config.callbackPath,'/auth/connectwunder/callback');
 assert.equal(config.tokenEndpoint,metadata.token_endpoint);
 assert.equal('clientSecret' in config,false);
 assert.throws(()=>configurationFromRegistration(registration,manifest,{...metadata,token_endpoint:'https://other.example.invalid/token'}));
 assert.throws(()=>configurationFromRegistration({...registration,oauth:{...registration.oauth,scopes:['mcp.full']}},manifest,metadata));
 assert.throws(()=>configurationFromRegistration({...registration,application:{...registration.application,origin:'https://other.example.invalid'}},manifest,metadata));
});


test('explicit board write grants preserve read-only manifests and demand exact configured action scopes', () => {
 const read = validateApplicationManifest(manifest);
 assert.equal('boardWriteGrants' in read, false);
 assert.deepEqual(validateApplicationManifest({...manifest, boardWriteGrants: []}), read);
 const grant = {boardId: 'synthetic-board', actions: ['notes.create', 'items.fields.write', 'items.create'], createColumnIds: ['synthetic-column'], createFieldKeys: ['title_key'], updateFieldKeys: ['status_key']};
 const write = {...manifest, boardWriteGrants: [grant]};
 const scopes = [...registration.oauth.scopes, 'apps.boards.notes.create', 'apps.boards.items.create', 'apps.boards.items.fields.write'];
 const response = {...registration, oauth: {...registration.oauth, scopes}};
 assert.deepEqual(configurationFromRegistration(response, write, metadata).scopes, scopes);
 assert.throws(() => configurationFromRegistration(response, manifest, metadata));
 assert.throws(() => configurationFromRegistration(registration, write, metadata));
 assert.throws(() => configurationFromRegistration({...response, oauth: {...response.oauth, scopes: [...scopes, 'mcp.full']}}, write, metadata));
 const normalized = validateApplicationManifest(write);
 assert.deepEqual(normalized.boardWriteGrants[0].actions, ['items.create', 'items.fields.write', 'notes.create']);
 assert.equal('boardWriteGrants' in manifest, false);
});

test('write planning rejects authority expansion and accepts explicit no-field creation', () => {
 const grant = {boardId:'synthetic-board', actions:['items.create'], createColumnIds:['synthetic-column'], createFieldKeys:[]};
 assert.deepEqual(validateApplicationManifest({...manifest,boardWriteGrants:[grant]}).boardWriteGrants[0].createFieldKeys, []);
 for (const bad of [
  {...grant,boardId:'unselected-board'}, {...grant,actions:['items.delete']}, {...grant,actions:['items.create','items.create']},
  {...grant,createColumnIds:[]}, {...grant,createFieldKeys:undefined}, {...grant,createFieldKeys:['bad-key']},
  {...grant,createFieldKeys:['same','same']}, {...grant,createFieldKeys:Array.from({length:41},(_,i)=>'f'+i)},
  {...grant,updateFieldKeys:['unrequested']}, {...grant,extra:true},
  {boardId:'synthetic-board',actions:['items.fields.write'],updateFieldKeys:[]},
 ]) assert.throws(() => validateApplicationManifest({...manifest,boardWriteGrants:[bad]}));
 assert.throws(() => validateApplicationManifest({...manifest,boardWriteGrants:[grant,grant]}));
 assert.throws(() => validateApplicationManifest({...manifest,mode:'external',boardIds:[],boardWriteGrants:[grant]}));
 assert.throws(() => validateApplicationManifest({...manifest,boardWriteGrants:[{boardId:'synthetic-board',actions:['notes.create'],createFieldKeys:[]}]}));
});
test('reporting scope requires explicit manifest opt-in and matching confirmed registration',()=>{
 const requested={...manifest,resultsReporting:true};
 const confirmed={...registration,oauth:{...registration.oauth,scopes:[...registration.oauth.scopes,'apps.results.import']}};
 assert.equal(validateApplicationManifest(requested).resultsReporting,true);
 assert.ok(configurationFromRegistration(confirmed,requested,metadata).scopes.includes('apps.results.import'));
 assert.throws(()=>configurationFromRegistration(confirmed,manifest,metadata));
 assert.throws(()=>configurationFromRegistration(registration,requested,metadata));
 assert.throws(()=>validateApplicationManifest({...manifest,mode:'external',boardIds:[],resultsReporting:true}));
});
