import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
let checked=0;
async function check(directory){for(const item of await readdir(directory,{withFileTypes:true})){const path=`${directory}/${item.name}`;if(item.isDirectory())await check(path);else if(/\.(js|mjs)$/.test(item.name)){const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);checked++;}}}
await check('src');await check('scripts');await check('tests');
console.log(`Syntax checked ${checked} JavaScript modules. React JSX is validated by npm run build.`);
