import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {navigationContractVersion, navigationTokens} from '../src/navigation-contract.js';

const {values} = parseArgs({options:{
  check:{type:'boolean'},
  'contract-dir':{type:'string'},
  'assets-dir':{type:'string'},
}});
const src = new URL('../src/', import.meta.url);
const contract = await readFile(new URL('navigation-contract.js', src), 'utf8');
const {version} = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
if (version !== navigationContractVersion) throw Error('Kit version and navigation contract version differ.');

const start = 'BEGIN GENERATED NAVIGATION CONTRACT';
const end = 'END GENERATED NAVIGATION CONTRACT';
const inlined = contract.replace(/^export /gmu, '');
const cssTokens = Object.entries(navigationTokens).map(([name, value]) => {
  const key = name.replace(/[A-Z]/gu, match => '-'+match.toLowerCase());
  return '  --cw-nav-token-'+key+': '+(typeof value === 'number' ? value+'px' : value)+';';
}).join('\n');
const outputs = new Map([
  ['navigation.js', inlined],
  ['navigation.css', ':host {\n'+cssTokens+'\n}\n'],
]);
async function save(target, expected) {
  if (values.check) {
    if (await readFile(target, 'utf8') !== expected) throw Error('Navigation asset differs: '+target);
  } else {
    await writeFile(target, expected);
  }
}
for (const [name, generated] of outputs) {
  const target = new URL(name, src);
  const contents = await readFile(target, 'utf8');
  const before = '/* '+start+' */\n';
  const after = '/* '+end+' */\n';
  const prefix = contents.startsWith(before) ? contents.slice(contents.indexOf(after)+after.length) : contents;
  const expected = before+generated+after+prefix;
  await save(target, expected);
  if (values['assets-dir']) await save(resolve(values['assets-dir'], name), expected);
  console.log(name, version, createHash('sha256').update(expected).digest('hex'));
}
if (values['contract-dir']) {
  const target = resolve(values['contract-dir'], 'navigation-contract.js');
  await save(target, contract);
  console.log('navigation-contract.js', version, createHash('sha256').update(contract).digest('hex'));
}
