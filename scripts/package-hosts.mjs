/** Repackage one maintained skill. Never reads external/internal source trees. */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const identity={name:'connectwunder-app-kit',version:pkg.version,description:'Build private ConnectWunder workspace applications with a shared Agent Skill.',author:{name:'ConnectWunder contributors'},license:'MIT'};
await writeFile(path.join(root,'plugin.json'),JSON.stringify({...identity,$schema:'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'},null,2)+'\n');
await mkdir(path.join(root,'.claude-plugin'),{recursive:true});
await writeFile(path.join(root,'.claude-plugin/plugin.json'),JSON.stringify(identity,null,2)+'\n');
const generated=path.join(root,'dist','hosts');
await mkdir(generated,{recursive:true});
for(const host of ['openai','claude']){
 const target=path.join(generated,host);
 await rm(target,{recursive:true,force:true});
 await mkdir(target,{recursive:true});
 for(const name of ['skills','src','scripts','tests','package.json','README.md','AGENTS.md','CLAUDE.md','LICENSE']) await cp(path.join(root,name),path.join(target,name),{recursive:true});
 const manifest={name:'connectwunder-app-kit',version:pkg.version,description:'Build private ConnectWunder workspace applications with a shared Agent Skill.',author:{name:'ConnectWunder contributors'},license:'MIT'};
 const manifestPath=host==='openai'?path.join(target,'plugin.json'):path.join(target,'.claude-plugin','plugin.json');
 await mkdir(path.dirname(manifestPath),{recursive:true});
 if(host==='openai') manifest.$schema='https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 const sourceSkill=await readFile(path.join(root,'skills/build-connectwunder-app/SKILL.md'),'utf8');
 const copy=await readFile(path.join(target,'skills/build-connectwunder-app/SKILL.md'),'utf8');
 if(copy!==sourceSkill)throw new Error('Generated skill differs from maintained source');
}
console.log('Generated OpenAI portable and Claude skill/plugin packages in dist/hosts; nothing published.');
