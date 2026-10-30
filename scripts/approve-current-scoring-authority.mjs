import './lib/ts-runtime.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {snapshotHash:hash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const old='docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation';
const review='docs/fundamental-data-engine/evidence/2026-10-29-current-authority-review';
const out='docs/fundamental-data-engine/evidence/2026-10-29-approved-authority-activation';
const configPath='src/infrastructure/dependencies/active-authorities.json';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const bytesHash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pin=path=>({path,sha256:bytesHash(readFileSync(path))});
const verify=p=>{if(pin(p.path).sha256!==p.sha256)throw Error('PIN_DRIFT:'+p.path);};
const manifest=read(review+'/SCORING_EXECUTABLE_REVIEW_MANIFEST.json');
const {contentHash,...body}=manifest;
if(hash(body)!==contentHash||contentHash!=='8c0880249dc54e2baea0235cc10094f818220db86331442ece3da05085261cc1')throw Error('UNAPPROVED_MANIFEST');
[...manifest.artifacts,...manifest.runtimeDependencyPins,...manifest.historicalPins,manifest.builder].forEach(verify);
if(existsSync(out))throw Error('ACTIVATION_ALREADY_EXISTS');
mkdirSync(out,{recursive:true});
const at=new Date().toISOString();
const save=(file,value)=>{const {contentHash:ignored,...b}=value;void ignored;const v={...b,contentHash:hash(b)};writeFileSync(out+'/'+file,JSON.stringify(v,null,2)+'\n');return v;};
writeFileSync(out+'/PREVIOUS_ACTIVE_AUTHORITIES.json',readFileSync(configPath));
// Exact user utterance, spelling preserved. Date-only instruction; recording instant is not a claimed message timestamp.
writeFileSync(out+'/OWNER_REQUEST.txt','Apporve cho mainifest mới\n');
const approval=save('OWNER_APPROVAL_RECEIPT.json',{
 contract:'owner-scoring-production-approval-v2',id:'owner-scoring-production-20261029-r1',ownerAuthority:'PROJECT_OWNER',approvalMode:'OWNER_GOVERNANCE_APPROVAL',approvalScope:'SCORING_EXECUTABLE_PRODUCTION',implementation:manifest.implementationId,version:manifest.methodologyVersion,buildRevision:manifest.buildRevision,
 ownerApprovalDate:'2026-10-29',statement:'Apporve cho mainifest mới',source:pin(out+'/OWNER_REQUEST.txt'),manifest:{id:manifest.id,hash:manifest.contentHash},
 interpretation:'Owner approves the exact new manifest immediately linked in the preceding assistant response; scope is the static executable authority activation previously described.',
 recordedAt:at,effectiveFrom:at,timePrecision:'Owner message date from session; timestamp is durable receipt recording time.',cryptographicOwnerSignature:false,
 excluded:['future changed bytes','new methodology weights','market/data admission','ranking or Top10 publication','investment decisions','DCA','allocation'],
});
const previousBundle=read(old+'/PRODUCTION_AUTHORITY_BUNDLE.json');
const previousExecutable=read(old+'/SCORING_EXECUTABLE_AUTHORITY.json');
const executable=save('SCORING_EXECUTABLE_AUTHORITY.json',{
 ...previousExecutable,id:'scoring-executable-production-m64-clarification-1-v1.0.0-20261029-r1',buildRevision:manifest.buildRevision,
 ownerApprovalDate:approval.ownerApprovalDate,manifest:pin(review+'/SCORING_EXECUTABLE_REVIEW_MANIFEST.json'),ownerApproval:pin(out+'/OWNER_APPROVAL_RECEIPT.json'),recordedAt:at,effectiveFrom:at,supersedes:{id:previousExecutable.id,hash:previousExecutable.contentHash},
});
const authorities=previousBundle.authorities.map(a=>a.type==='SCORING_EXECUTABLE'?{type:a.type,id:executable.id,hash:executable.contentHash,artifact:pin(out+'/SCORING_EXECUTABLE_AUTHORITY.json')}:a);
const compatibilities=previousBundle.compatibilities.map(p=>{
 const prior=read(p.path);prior.rules.forEach(r=>{verify(r.governing);verify(r.implementation);});
 const current=save(p.path.split('/').at(-1),{...prior,id:prior.id.replace('20261020','20261029-r1'),authorities:prior.pair.split(':').map(type=>{const a=authorities.find(a=>a.type===type);return {type,id:a.id,hash:a.hash};}),
 rules:[...prior.rules,...(prior.pair.includes('SCORING_EXECUTABLE')?[{id:'Reviewed opening receivable and dividend settlement delta preserves scoring semantics and separates receivables from cash',result:'PASS',governing:pin(review+'/REPORT.md'),implementation:pin('src/domain/portfolio/transaction.ts'),testReferences:['tests/unit/dividend-settlement.test.ts','tests/integration/dividend-settlement.test.ts','tests/unit/portfolio-accounting.test.ts','tests/unit/scoring-golden.test.ts']}]:[])],
 approvalBasis:'Revalidated all existing governing/implementation bytes; exact 37-file review and explicit owner approval of 20261029-r1. No inherited approval for changed bytes.',recordedAt:at,supersedes:{id:prior.id,hash:prior.contentHash}});
 return {...pin(out+'/'+p.path.split('/').at(-1)),id:current.id,hash:current.contentHash};
});
const methodology={...previousBundle.methodology,methodologyId:'m64-clarification-1-production-20261029-r1',approvalReference:out+'/OWNER_APPROVAL_RECEIPT.json',effectiveDate:approval.ownerApprovalDate,configurationReference:'scoring-executable-manifest-sha256:'+manifest.contentHash,recordedAt:at};
const bundle=save('PRODUCTION_AUTHORITY_BUNDLE.json',{...previousBundle,id:'production-authority-bundle-20261029-r1',authorities,compatibilities,methodology,approvalProvenance:pin(out+'/OWNER_APPROVAL_RECEIPT.json'),recordedAt:at,effectiveFrom:at,supersedes:{id:previousBundle.id,hash:previousBundle.contentHash}});
const heads=new Map();
const buildHead=type=>{
 if(heads.has(type))return heads.get(type);
 const h=read(old+'/HEAD_'+type+'.json');
 const requires=h.requires.map(r=>({type:r.type,pin:buildHead(r.type).pin}));
 const content={...h.content};if(content.authorityBundle)content.authorityBundle={id:bundle.id,hash:bundle.contentHash};
 if(type==='SCORING_MODEL'){content.executableAuthority={id:executable.id,hash:executable.contentHash};content.methodology=methodology;}
 const current={...h,pin:{id:'production-'+type.toLowerCase()+'-20261029-r1',hash:hash(content)},content,requires,recordedAt:at,effectiveFrom:at,sourceReference:out+'/PRODUCTION_AUTHORITY_BUNDLE.json',authorityReference:out+'/OWNER_APPROVAL_RECEIPT.json'};
 heads.set(type,current);writeFileSync(out+'/HEAD_'+type+'.json',JSON.stringify(current,null,2)+'\n');return current;
};
['POLICY','RISK_POLICY','SCORING_MODEL','DECISION_ENGINE'].forEach(buildHead);
const config={...read(configPath),authorityBundle:pin(out+'/PRODUCTION_AUTHORITY_BUNDLE.json'),bindings:[...heads.keys()].map(t=>pin(out+'/HEAD_'+t+'.json')),status:'ACCEPTED_STATIC_AUTHORITIES_PENDING_CAS',note:'Owner approved exact 20261029-r1 manifest on 2026-10-29. Static authority only; independent data/market/release/publication/decision gates remain mandatory.'};
writeFileSync(out+'/PROPOSED_ACTIVE_AUTHORITIES.json',JSON.stringify(config,null,2)+'\n');
console.log(JSON.stringify({out,manifestHash:manifest.contentHash,bundleHash:bundle.contentHash,approvalHash:approval.contentHash}));
