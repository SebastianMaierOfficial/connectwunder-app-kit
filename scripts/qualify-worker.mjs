/** Optional local qualification using an existing official workerd binary. No downloads. */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { qualifyNativeWorker, stopOwnedRuntime } from './qualify-native-worker.mjs';
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,value,index,all)=>index%2===0?[...pairs,[value,all[index+1]]]:pairs,[]));
if(!args['--binary']||!args['--scratch']||!args['--evidence'])throw new Error('Required: --binary /path/to/workerd --scratch /new/empty/path --evidence /local/evidence');
const binary=path.resolve(args['--binary']);
if(!(await stat(binary)).isFile())throw new Error('The supplied workerd binary is not a file');
const scratch=path.resolve(args['--scratch']),evidence=path.resolve(args['--evidence']);
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(scratch); // Refuse an existing path; never overwrite another run.
await mkdir(evidence,{recursive:true});
const version=spawnSync(binary,['--version'],{encoding:'utf8',timeout:5000,maxBuffer:16384});
if(version.status!==0)throw new Error('The supplied workerd binary did not identify itself');
const inputs=[['tests/fixtures/worker.js','esModule','tests/fixtures/worker.js'],['src/auth.js','esModule','src/auth.js'],['navigation-source','text','src/navigation.js'],['navigation-css','text','src/navigation.css']];
const modules=[],hashes={};
for(let index=0;index<inputs.length;index++){
 const [name,kind,file]=inputs[index];
 const data=await readFile(path.join(root,file));
 const target=`module-${index}.txt`;
 await writeFile(path.join(scratch,target),data);
 hashes[file]=createHash('sha256').update(data).digest('hex');
 modules.push(`(name = ${JSON.stringify(name)}, ${kind} = embed ${JSON.stringify(target)})`);
}
const listener=createServer();
await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolve);});
const port=listener.address().port;
await new Promise(resolve=>listener.close(resolve));
const config=`using Workerd = import "/workerd/workerd.capnp";\nconst config :Workerd.Config = (services = [(name = "main", worker = (compatibilityDate = "2026-11-16", modules = [${modules.join(',')}]))], sockets = [(name = "http", address = "127.0.0.1:${port}", http = (), service = "main")]);\n`;
await writeFile(path.join(scratch,'config.capnp'),config);
const child=spawn(binary,['serve',path.join(scratch,'config.capnp')],{cwd:scratch,detached:true,stdio:['ignore','pipe','pipe']});
let logs='';
const collect=chunk=>{if(logs.length<65536)logs+=chunk.toString().slice(0,65536-logs.length);};
child.stdout.on('data',collect);child.stderr.on('data',collect);
let terminated=false;
let result;
const stop=()=>{try{process.kill(-child.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')throw error;}};
const interrupted=()=>{terminated=true;stop();};
process.once('SIGTERM',interrupted);process.once('SIGINT',interrupted);
try{
 const deadline=Date.now()+25000;
 while(Date.now()<deadline&&!terminated){
  if(child.exitCode!==null)throw new Error('workerd stopped before readiness');
  try{
   const response=await fetch(`http://localhost:${port}/qualify`,{signal:AbortSignal.timeout(2000)});
   result=await response.json();
   break;
  }catch{await new Promise(resolve=>setTimeout(resolve,100));}
 }
 if(terminated)throw new Error('qualification_canceled');
 if(!result||result.status!=='pass')throw new Error('Worker fixture did not pass');
 result={...result,providerTransport:'injected-in-process-fetch-stub',nativeProviderNetwork:false,workerdVersion:version.stdout.trim(),sourceSha256:hashes,actualHostedProviderTest:false};
 await writeFile(path.join(evidence,'qualification.json'),JSON.stringify({status:'running',stateMachineFixture:result,nativeNetwork:'pending'},null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}finally{
 await stopOwnedRuntime(child);
 if(terminated)await writeFile(path.join(evidence,'qualification.json'),JSON.stringify({status:'canceled',phase:'state-machine'},null,2)+'\n');
 await writeFile(path.join(evidence,'workerd.log'),logs);
 process.removeListener('SIGTERM',interrupted);process.removeListener('SIGINT',interrupted);
}

if(terminated){
 await writeFile(path.join(evidence,'qualification.json'),JSON.stringify({status:'canceled',phase:'state-machine'},null,2)+'\n');
 throw new Error('qualification_canceled');
}
let nativeNetwork;
try {
 nativeNetwork = await qualifyNativeWorker({ binary, scratch:path.join(scratch,'native-network'), evidence:path.join(evidence,'native-network') });
} catch(error) {
 await writeFile(path.join(evidence,'qualification.json'),JSON.stringify({status:error.code==='qualification_canceled'?'canceled':'fail',stateMachineFixture:result,nativeNetwork:'not_passed'},null,2)+'\n');
 throw error;
}
const combined = {status:'pass',workerdVersion:version.stdout.trim(),stateMachineFixture:result,nativeNetwork,actualHostedProviderTest:false};
await writeFile(path.join(evidence,'qualification.json'),JSON.stringify(combined,null,2)+'\n');
console.log(JSON.stringify({status:combined.status,nativeHttpCounters:nativeNetwork.nativeHttpCounters,nativeNetworkChecks:nativeNetwork.nativeNetworkChecks,actualHostedProviderTest:false},null,2));
