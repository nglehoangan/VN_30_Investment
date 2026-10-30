import './lib/ts-runtime.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {verifyProductionAuthorityBundle,authorityBytes}=await import('../src/infrastructure/dependencies/production-authority.ts');
const out='docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation';
const config=JSON.parse(readFileSync('src/infrastructure/dependencies/active-authorities.json','utf8'));
const verified=verifyProductionAuthorityBundle(process.cwd(),config.authorityBundle);
const manifest=verified.manifest;
if(manifest.contentHash!=='8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1')throw Error('WRONG_APPROVED_MANIFEST');
let archived=0;
for(const p of manifest.historicalPins){
 if(p.path==='src/infrastructure/dependencies/active-authorities.json'){
  const bytes=readFileSync(out+'/PREVIOUS_ACTIVE_AUTHORITIES.json');
  if(createHash('sha256').update(bytes).digest('hex')!==p.sha256||bytes.length!==p.size)throw Error('PREVIOUS_ANCHOR_DRIFT');
  archived++;
 }else if(authorityBytes(process.cwd(),p).length!==p.size)throw Error('HISTORICAL_SIZE_DRIFT');
}
authorityBytes(process.cwd(),manifest.builder);
console.log(JSON.stringify({status:'PASS',manifestContentHash:manifest.contentHash,artifacts:manifest.artifacts.length,historicalFilesUnchanged:manifest.historicalPins.length-archived,previousConfigurationArchived:archived,compatibilities:verified.compatibilities.length},null,2));
