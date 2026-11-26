import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createServer} from 'node:http';
import {setDefaultResultOrder} from 'node:dns';
import {createResultsReporter} from '../src/results.js';

setDefaultResultOrder('ipv4first');
const listen=server=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port));});
const close=server=>new Promise(resolve=>server.close(resolve));
test('native fetch sends only to the confirmed resource and never follows a provider redirect',async()=>{
 let traps=0,requests=0,redirect=false;
 const trap=createServer((_req,res)=>{traps++;res.end();});const trapPort=await listen(trap);
 const provider=createServer((req,res)=>{requests++;assert.equal(req.url,'/api/workspace-apps/v1/results/import');assert.equal(req.headers.authorization,'Bearer synthetic-token');
   if(redirect){res.writeHead(302,{location:`http://localhost:${trapPort}/trap`});res.end();}else{res.writeHead(200,{'content-type':'application/json'});res.end('{"version":1,"entries":[{"status":"accepted"}]}');}});
 const port=await listen(provider);
 try {
  const auth={withAccessToken:async(_request,fn)=>fn('synthetic-token',new AbortController().signal)};
  const reporter=createResultsReporter({auth,resource:`http://localhost:${port}/api/workspace-apps/v1`,sourceId:'source_1',allowLocalhost:true});
  const request=new Request('https://app.example.invalid/submit'),entry={kind:'outcome',eventId:'event_1',occurredAt:'2026-11-26T12:00:00Z',outcomeType:'release',outcomeId:'release_1'};
  assert.equal((await reporter.submit(request,[entry])).status,200);redirect=true;
  assert.equal((await reporter.submit(request,[entry])).status,502);assert.equal(requests,2);assert.equal(traps,0);
 } finally {await Promise.all([close(provider),close(trap)]);}
});
