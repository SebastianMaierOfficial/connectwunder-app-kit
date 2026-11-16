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
