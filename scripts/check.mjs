import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=[];
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(['.git','node_modules','dist','.local'].includes(entry.name))continue;
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())await walk(file);else files.push(file);
 }
}
await walk(root);
for(const file of files){
 const text=await readFile(file,'utf8');
 if(text.split('\n').some(line=>/[\t ]$/u.test(line)))throw new Error('Trailing whitespace: '+path.relative(root,file));
 if(text.includes('\u0000'))throw new Error('Unexpected binary content: '+path.relative(root,file));
 if(file.endsWith('.md')){
  for(const match of text.matchAll(/\]\(([^)]+)\)/gu)){
   const target=match[1];
   if(/^(https?:|#)/u.test(target))continue;
   const resolved=path.resolve(path.dirname(file),target.split('#')[0]);
   if(!resolved.startsWith(root))throw new Error('Documentation link escapes kit');
   await readFile(resolved);
  }
 }
}
for(const file of ['src/auth.js','src/navigation.js']){
 const text=await readFile(path.join(root,file),'utf8');
 if(/(?:from\s*|import\s*\()\s*['"](?:node:|fs\b|crypto\b|buffer\b|path\b)/u.test(text)||/\b(?:process|Buffer)\b/u.test(text))throw new Error('Shared module contains a Node-only assumption: '+file);
}
const skill=await readFile(path.join(root,'skills/build-connectwunder-app/SKILL.md'),'utf8');
if(!skill.startsWith('---\nname: build-connectwunder-app\ndescription: '))throw new Error('Agent Skill metadata missing');
console.log('Source, shared Web API boundary, skill metadata and local documentation links checked.');
