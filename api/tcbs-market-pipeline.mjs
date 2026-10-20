/** Request-driven source refresh -> bounded capture -> replay -> immutable candidate -> read-model binding. */
import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2),capture=args.find(a=>a.startsWith('--capture='))?.slice(10),board=args.find(a=>a.startsWith('--board='))?.slice(8);
if(args.includes('--refresh')){
 const result=spawnSync(process.execPath,['api/capture-vn30-market.mjs'],{encoding:'utf8',timeout:180000});
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.status!==0){process.exitCode=1;}else{
  const line=result.stdout.trim().split('\n').at(-1),manifest=JSON.parse(line).manifest;
  if(typeof manifest!=='string'||!/^data\/market-source\/tcbs\/[A-Za-z0-9.:-]+\/manifest\.json$/.test(manifest))throw Error('BOUNDED_CAPTURE_PATH');
  const folder=manifest.slice(0,-'/manifest.json'.length);
  const built=spawnSync(process.execPath,['scripts/build-tcbs-pipeline.mjs','--capture='+folder,'--board='+(board??folder),'--bind-candidate'],{stdio:'inherit',timeout:60000});process.exitCode=built.status??1;
 }
}else if(capture&&board){
 const built=spawnSync(process.execPath,['scripts/build-tcbs-pipeline.mjs','--capture='+capture,'--board='+board,'--bind-candidate'],{stdio:'inherit',timeout:60000});process.exitCode=built.status??1;
}else{console.log('Usage: node api/tcbs-market-pipeline.mjs --refresh [--board=<explicit prior completed board folder>]\nOffline: node api/tcbs-market-pipeline.mjs --capture=<explicit folder> --board=<explicit folder>\nCached JWT only; no account APIs, no background refresh or investment outputs. Independent DI14/DI15 acceptance remains required.');process.exitCode=args.includes('--help')?0:1;}
