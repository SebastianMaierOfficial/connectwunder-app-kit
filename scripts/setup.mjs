/** Local plan/config helper. Registration itself uses the connected human MCP. */
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { validateApplicationManifest, configurationFromRegistration } from '../src/setup.js';
const [command, input, ...rest] = process.argv.slice(2);
if(rest.length%2!==0)throw new Error('Each setup option requires one value');
const flags=Object.fromEntries(rest.reduce((pairs,value,index,all)=>index%2===0?[...pairs,[value,all[index+1]]]:pairs,[]));
async function load(file){return JSON.parse(await readFile(file,'utf8'));}
async function writeExclusive(file,value){
 if(!file)throw new Error('Use --out with a project-local output path');
 try{await writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});return 'created';}
 catch(error){if(error.code!=='EEXIST')throw error;const prior=await load(file);if(JSON.stringify(prior)!==JSON.stringify(value))throw new Error('Output exists with different content; reconcile it instead of overwriting');return 'reused';}
}
try{
 if(Object.keys(flags).some(key=>!['--out','--manifest','--metadata'].includes(key)))throw new Error('Unsupported setup option; no token or credential options are accepted');
 if(!command||!input)throw new Error('Use: check manifest.json; plan manifest.json --out plan.json; configure registration.json --manifest manifest.json --metadata discovery.json --out config.json');
 if(command==='check'){
  const manifest=validateApplicationManifest(await load(input));
  console.log(JSON.stringify({valid:true,mode:manifest.mode,boardCount:manifest.boardIds.length,audience:manifest.visibility}));
 }else if(command==='plan'){
  const application=validateApplicationManifest(await load(input));
  if(!flags['--out'])throw new Error('Use --out to persist the idempotency key');
  let prior;
  try{prior=await load(flags['--out']);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(prior){
   if(prior.tool!=='register_application'||typeof prior.arguments?.operationKey!=='string'||!/^[A-Za-z0-9_-]{8,100}$/u.test(prior.arguments.operationKey)||JSON.stringify(prior.arguments?.application)!==JSON.stringify(application))throw new Error('Existing plan describes a different registration; reconcile before retry');
   console.log(JSON.stringify({plan:flags['--out'],status:'reused',tool:prior.tool}));
  }else{
   const value={tool:'register_application',arguments:{operationKey:'app_'+randomUUID().replaceAll('-',''),application}};
   await writeExclusive(flags['--out'],value);
   console.log(JSON.stringify({plan:flags['--out'],status:'created',tool:value.tool}));
  }
 }else if(command==='configure'){
  if(!flags['--manifest']||!flags['--metadata'])throw new Error('Use --manifest and --metadata with the authoritative registration and issuer discovery results');
  const config=configurationFromRegistration(await load(input),await load(flags['--manifest']),await load(flags['--metadata']));
  console.log(JSON.stringify({configuration:flags['--out'],status:await writeExclusive(flags['--out'],config)}));
 }else throw new Error('Unknown setup command');
}catch(error){console.error(error.message);process.exitCode=1;}
