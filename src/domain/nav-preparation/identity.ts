import type {Bridge,BridgePayload,BridgeRow,Digest,IdentityRequest} from './contracts';
import {fields,text,hash,time,day,uuid,list,evidence,dimension,known,requireNav,contentHash,immutable} from './validation';
function validateRow(value:unknown):asserts value is BridgeRow {
 fields(value,'id ledgerNamespace ledgerSecurityId marketNamespace marketSecurityId provider providerInstrumentCode isin alternate venue securityClass ticker validFrom validTo knownFrom knownTo recordedAt relationship corporateActionStatus ledgerAnchor marketAnchor intervalEvidence corporateActionEvidence');
 const r=value as unknown as BridgeRow;
 [r.id,r.ledgerNamespace,r.ledgerSecurityId,r.marketNamespace,r.providerInstrumentCode,r.ticker].forEach(text);uuid(r.marketSecurityId);dimension(r.venue,r.securityClass);
 requireNav(r.provider==='TCBS'&&r.relationship==='SAME_ECONOMIC_INSTRUMENT','UNSUPPORTED_IDENTITY_RELATIONSHIP');
 requireNav(/^\d+$/.test(r.providerInstrumentCode),'PROVIDER_INSTRUMENT_CODE_REQUIRED');
 requireNav(/^[A-Z0-9_]{1,30}$/.test(r.ticker),'INVALID_TICKER');
 if(r.isin!==null)requireNav(typeof r.isin==='string'&&/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin),'INVALID_ISIN');
 if(r.alternate!==null){
  fields(r.alternate,'kind providerInstrumentCode venue securityClass continuity');requireNav(r.alternate.kind==='STABLE_PROVIDER_CODE_VENUE_CLASS_AND_CONTINUITY','INVALID_ALTERNATE_IDENTITY');
  requireNav(r.alternate.providerInstrumentCode===r.providerInstrumentCode&&r.alternate.venue===r.venue&&r.alternate.securityClass===r.securityClass,'ALTERNATE_IDENTITY_MISMATCH');list(r.alternate.continuity);r.alternate.continuity.forEach(evidence);
 }
 requireNav(r.isin!==null||r.alternate!==null,'ISIN_OR_ALTERNATE_EVIDENCE_REQUIRED');
 day(r.validFrom);if(r.validTo!==null)day(r.validTo);requireNav(r.validTo===null||r.validFrom<r.validTo,'INVALID_EFFECTIVE_INTERVAL');
 time(r.knownFrom);if(r.knownTo!==null)time(r.knownTo);time(r.recordedAt);requireNav(r.knownFrom<=r.recordedAt&&(r.knownTo===null||r.recordedAt<r.knownTo),'INVALID_KNOWLEDGE_INTERVAL');
 requireNav(['CLEAR','UNCERTAIN'].includes(r.corporateActionStatus),'INVALID_CORPORATE_ACTION_STATUS');
 [r.ledgerAnchor,r.marketAnchor,r.intervalEvidence,r.corporateActionEvidence,...r.alternate?.continuity??[]].forEach(e=>{evidence(e);known(e,r.knownFrom);});
}
function payload(raw:unknown):asserts raw is BridgePayload {
 fields(raw,'contractVersion mode portfolioId createdAt rows');const b=raw as unknown as BridgePayload;
 requireNav(b.contractVersion==='nav-security-identity-bridge-v1'&&b.mode==='OFFLINE_PREPARATION','UNSUPPORTED_BRIDGE_CONTRACT');text(b.portfolioId);time(b.createdAt);list(b.rows);b.rows.forEach(validateRow);
 requireNav(new Set(b.rows.map(r=>r.id)).size===b.rows.length,'DUPLICATE_BRIDGE_ROW');
 for(const [i,r] of b.rows.entries()){
  requireNav(r.recordedAt<=b.createdAt,'FUTURE_RECORDED_BRIDGE');
  for(const s of b.rows.slice(i+1)){
   const overlap=(r.validTo===null||s.validFrom<r.validTo)&&(s.validTo===null||r.validFrom<s.validTo);
   if(!overlap)continue;
   requireNav(!(r.ledgerNamespace===s.ledgerNamespace&&r.ledgerSecurityId===s.ledgerSecurityId),'OVERLAPPING_LEDGER_IDENTITY');
   requireNav(!(r.marketNamespace===s.marketNamespace&&r.marketSecurityId===s.marketSecurityId),'AMBIGUOUS_REVERSE_IDENTITY');
   requireNav(!(r.provider===s.provider&&r.venue===s.venue&&r.securityClass===s.securityClass&&(r.providerInstrumentCode===s.providerInstrumentCode||r.ticker===s.ticker||(r.isin!==null&&r.isin===s.isin))),'AMBIGUOUS_PROVIDER_IDENTITY');
  }
 }
}
export function prepareBridge(raw:unknown,digest:Digest):Bridge {payload(raw);return readBridge({...raw,contentHash:contentHash(raw,digest)},digest);}
export function readBridge(raw:unknown,digest:Digest):Bridge {
 fields(raw,'contractVersion mode portfolioId createdAt rows contentHash');hash(raw.contentHash);const {contentHash:expected,...body}=raw;payload(body);requireNav(contentHash(body,digest)===expected,'BRIDGE_HASH_MISMATCH');return immutable(raw as unknown as Bridge);
}
/** Resolution is an offline correspondence, never an accepted mapping. Ticker is not a lookup key. */
export function resolveBridge(raw:unknown,request:IdentityRequest,digest:Digest):{readonly row:BridgeRow;readonly bridgeHash:string;readonly acceptedMapping:false} {
 fields(request,'portfolioId ledgerNamespace ledgerSecurityId marketNamespace provider venue securityClass tradingDate knowledgeCutoff now');
 const b=readBridge(raw,digest);[request.portfolioId,request.ledgerNamespace,request.ledgerSecurityId,request.marketNamespace].forEach(text);dimension(request.venue,request.securityClass);requireNav(request.provider==='TCBS','UNSUPPORTED_PROVIDER');
 day(request.tradingDate);time(request.knowledgeCutoff);time(request.now);requireNav(request.knowledgeCutoff<=request.now&&request.tradingDate<=request.now.slice(0,10),'FUTURE_REQUEST');requireNav(b.portfolioId===request.portfolioId,'BRIDGE_PORTFOLIO_MISMATCH');requireNav(b.createdAt<=request.knowledgeCutoff,'BRIDGE_NOT_KNOWN');
 const rows=b.rows.filter(r=>r.ledgerNamespace===request.ledgerNamespace&&r.ledgerSecurityId===request.ledgerSecurityId&&r.marketNamespace===request.marketNamespace&&r.provider===request.provider&&r.validFrom<=request.tradingDate&&(r.validTo===null||request.tradingDate<r.validTo)&&r.knownFrom<=request.knowledgeCutoff&&r.recordedAt<=request.knowledgeCutoff&&(r.knownTo===null||request.knowledgeCutoff<r.knownTo));
 requireNav(rows.length===1,rows.length?'AMBIGUOUS_IDENTITY':'MISSING_IDENTITY_EVIDENCE');const row=rows[0];requireNav(row.venue===request.venue,'VENUE_MISMATCH');requireNav(row.securityClass===request.securityClass,'SECURITY_CLASS_MISMATCH');requireNav(row.corporateActionStatus==='CLEAR','CORPORATE_ACTION_UNCERTAIN');return immutable({row,bridgeHash:b.contentHash,acceptedMapping:false as const});
}
