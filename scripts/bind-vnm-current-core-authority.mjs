// Narrow successor: targeted retained native cells, same owner implementation instruction/source principles.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16';
const read=p=>JSON.parse(readFileSync(p,'utf8')),pin=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const predecessor=out+'/VERSIONED_SOURCE_REGISTRY_V5.json',r=read(predecessor),target=out+'/VERSIONED_SOURCE_REGISTRY_V51.json';
if(existsSync(target)){const existing=read(target);for(const p of existing.authorities.find(a=>a.domain==='F2').retainedCatalogs)if(pin(p.path).sha256!==p.sha256)throw Error('IMMUTABLE_CATALOG_CHANGED');console.log(JSON.stringify({registry:pin(target),duplicate:true}));process.exit(0);}
r.version='owner-standing-authority-v5.1-current-native-core';r.predecessor=pin(predecessor);r.recordedAt=new Date().toISOString();
const a=r.authorities.find(a=>a.domain==='F2');a.version='5.1';a.retainedCatalogs=[pin(out+'/MAPPING_CONTRACT_V3.json'),pin(out+'/DOCUMENT_BINDINGS_V2.json'),read('docs/fundamental-data-engine/standing-authority-version/2026-11-12/REAL_FINANCIAL_REQUEST.json').material.identities];
a.validatedAdapterScope={...a.validatedAdapterScope,selectedComparativeAndCurrentFacts:68,currentFinancialInputs:34,targetedExtension:['INVENTORY','CFO','DEPRECIATION_AMORTIZATION','ASSET_PURCHASE_CASH_OUTFLOW','CASH_INTEREST_PAID','CASH_TAX_PAID','NET_INCOME_ATTRIBUTABLE_PARENT'],rawPDFReacquired:false,reportedBorrowingsAggregation:'NOT_GRANTED_WITHOUT_EXISTING_DEBT_CONTRACT_PROOF',fullM3CoverageCertified:false};
writeFileSync(target,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({registry:pin(target),sourceApprovalsChanged:false}));
