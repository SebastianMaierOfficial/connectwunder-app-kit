/** Server-only, opt-in delivery of allowlisted workspace result metadata. */
const id=/^[A-Za-z0-9_-]{1,160}$/u;
const validId=value=>typeof value==='string' && id.test(value);
const metricKeys=['inputTokens','outputTokens','cachedInputTokens','cacheWriteTokens','estimatedCostUsdMicros'];
function validEntry(entry) {
  if (!entry || typeof entry!=='object' || Array.isArray(entry) || !validId(entry.eventId)
    || typeof entry.occurredAt!=='string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z$/u.test(entry.occurredAt)) return false;
  let fields;
  if (entry.kind==='usage') {
    fields=['kind','eventId','occurredAt','provider','requestId',...metricKeys];
    if(!validId(entry.provider) || !validId(entry.requestId) || metricKeys.some(k=>entry[k]!==undefined && (!Number.isSafeInteger(entry[k]) || entry[k]<0))) return false;
  } else if(entry.kind==='outcome') {
    fields=['kind','eventId','occurredAt','outcomeType','outcomeId'];
    if(!validId(entry.outcomeType) || !validId(entry.outcomeId))return false;
  } else if(entry.kind==='reference') {
    fields=['kind','eventId','occurredAt','operationRef','workId'];
    if(typeof entry.operationRef!=='string' || !/^[a-f0-9]{64}$/u.test(entry.operationRef) || typeof entry.workId!=='string' || !/^external_[a-f0-9]{64}$/u.test(entry.workId))return false;
  } else return false;
  return Object.keys(entry).every(key=>fields.includes(key));
}
async function safeResponse(response, expectedCount) {
  if (!(response instanceof Response)) throw new TypeError('Invalid provider response');
  if (response.status>=300 && response.status<400) {await response.body?.cancel();return new Response(null,{status:502,headers:{'cache-control':'no-store'}});}
  if (response.status!==200) {
    await response.body?.cancel();
    const status=[400,401,403,409,413,429,500,502,503].includes(response.status)?response.status:502;
    return new Response(JSON.stringify({error:status===409?'reference_pending':'reporting_unavailable'}),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }
  const reader=response.body?.getReader();if(!reader)return new Response(null,{status:502});
  const chunks=[];let size=0;
  for(;;) {const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>65536){await reader.cancel();return new Response(null,{status:502});}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let data;try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return new Response(null,{status:502});}
  if(data?.version!==1 || !Array.isArray(data.entries) || data.entries.length!==expectedCount || data.entries.some(entry=>!entry || typeof entry!=='object' || !['accepted','replayed','invalid','conflict'].includes(entry.status) || (entry.receipt!==undefined && (typeof entry.receipt!=='string'||!/^[a-f0-9]{64}$/u.test(entry.receipt)))))return new Response(null,{status:502});
  return Response.json({version:1,entries:data.entries.map(entry=>({status:entry.status,...(entry.receipt?{receipt:entry.receipt}:{})}))},{headers:{'cache-control':'no-store'}});
}
export function createResultsReporter({auth,resource,sourceId,fetch:fetcher=globalThis.fetch,allowLocalhost=false}) {
  if(typeof window!=='undefined' || !auth || typeof auth.withAccessToken!=='function' || typeof fetcher!=='function' || !validId(sourceId))throw new TypeError('Invalid server reporting configuration');
  let url;try{url=new URL(resource);}catch{throw new TypeError('Invalid reporting resource');}
  const local=allowLocalhost && url.protocol==='http:' && url.hostname==='localhost';
  if((!local && url.protocol!=='https:') || url.username || url.password || url.search || url.hash || url.pathname!=='/api/workspace-apps/v1')throw new TypeError('Invalid reporting resource');
  const endpoint=url.href+'/results/import';
  return Object.freeze({
    /** Retry the identical event IDs and fields after timeouts or a pending reference. */
    async submit(request,entries) {
      if(!Array.isArray(entries) || !entries.length || entries.length>100 || !entries.every(validEntry))throw new TypeError('Invalid reporting entries');
      const body=JSON.stringify({version:1,sourceId,entries});
      if(new TextEncoder().encode(body).byteLength>65536)throw new TypeError('Reporting request is too large');
      return auth.withAccessToken(request,async(token,signal)=>{
        const response=await fetcher(endpoint,{method:'POST',redirect:'manual',signal,headers:{authorization:`Bearer ${token}`,'content-type':'application/json','accept':'application/json'},body});
        return safeResponse(response,entries.length);
      });
    },
  });
}
