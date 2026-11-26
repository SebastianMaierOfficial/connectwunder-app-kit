import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createResultsReporter} from '../src/results.js';

const outcome={kind:'outcome',eventId:'event_1',occurredAt:'2026-11-26T12:00:00Z',outcomeType:'release',outcomeId:'release_1'};
test('server reporter retries an identical durable payload through the authenticated session',async()=>{
 const calls=[];const auth={withAccessToken:async(_request,fn)=>fn('synthetic-token',new AbortController().signal)};
 const reporter=createResultsReporter({auth,resource:'https://api.example.invalid/api/workspace-apps/v1',sourceId:'source_1',fetch:async(url,options)=>{calls.push({url,options});return Response.json({version:1,entries:[{status:calls.length===1?'accepted':'replayed'}]});}});
 assert.equal((await reporter.submit(new Request('https://app.example.invalid/submit'),[outcome])).status,200);
 assert.equal((await reporter.submit(new Request('https://app.example.invalid/submit'),[outcome])).status,200);
 assert.equal(calls[0].options.body,calls[1].options.body);assert.equal(calls[0].options.redirect,'manual');
 assert.equal(calls[0].url,'https://api.example.invalid/api/workspace-apps/v1/results/import');
});
test('rejects unknown private fields, oversize batches, wrong resource and redirects',async()=>{
 const auth={withAccessToken:async(_request,fn)=>fn('synthetic-token',new AbortController().signal)};
 assert.throws(()=>createResultsReporter({auth,resource:'https://example.invalid/other',sourceId:'source_1'}));
 const reporter=createResultsReporter({auth,resource:'https://api.example.invalid/api/workspace-apps/v1',sourceId:'source_1',fetch:async()=>new Response(null,{status:302,headers:{location:'https://other.example.invalid'}})});
 await assert.rejects(reporter.submit(new Request('https://app.example.invalid'),[{...outcome,prompt:'private'}]));
 await assert.rejects(reporter.submit(new Request('https://app.example.invalid'),Array(101).fill(outcome)));
 assert.equal((await reporter.submit(new Request('https://app.example.invalid'),[outcome])).status,502);
});
test('provider response is bounded and cannot set app cookies or echo arbitrary fields',async()=>{
 const auth={withAccessToken:async(_request,fn)=>fn('synthetic-token',new AbortController().signal)};
 let large=false;
 const reporter=createResultsReporter({auth,resource:'https://api.example.invalid/api/workspace-apps/v1',sourceId:'source_1',fetch:async()=>large?new Response('x'.repeat(65537)):
  Response.json({version:1,entries:[{status:'accepted',receipt:'a'.repeat(64),private:'discard'}],extra:'discard'},{headers:{'set-cookie':'untrusted=1'}})});
 const request=new Request('https://app.example.invalid');const response=await reporter.submit(request,[outcome]);
 assert.equal(response.headers.get('set-cookie'),null);assert.deepEqual(await response.json(),{version:1,entries:[{status:'accepted',receipt:'a'.repeat(64)}]});
 large=true;assert.equal((await reporter.submit(request,[outcome])).status,502);
});
test('recovery unavailability keeps the response retryable and the submitted identity unchanged',async()=>{
 const calls=[];const auth={withAccessToken:async(_request,fn)=>fn('synthetic-token',new AbortController().signal)};
 const reporter=createResultsReporter({auth,resource:'https://api.example.invalid/api/workspace-apps/v1',sourceId:'source_1',fetch:async(_url,options)=>{calls.push(options.body);return calls.length===1?Response.json({error:'results_recovery_in_progress'},{status:503}):Response.json({version:1,entries:[{status:'replayed'}]});}});
 const request=new Request('https://app.example.invalid/submit');const first=await reporter.submit(request,[outcome]);assert.equal(first.status,503);assert.deepEqual(await first.json(),{error:'reporting_unavailable'});
 assert.equal((await reporter.submit(request,[outcome])).status,200);assert.equal(calls[0],calls[1]);
});
