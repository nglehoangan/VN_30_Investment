/** Purpose-specific immutable references in the existing analytical catalog; no legacy FORMAL cast. */
import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {CurrentPurposeScoring} from './current-scoring';
import type {CurrentPublishedScores,CurrentReleaseGate,CurrentPublicationSubject,CurrentPublishedCard} from '@/ports/current-publication';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {assertNotRevoked} from '@/infrastructure/repositories/unified-admission';
import {check} from '@/domain/scoring/validation';
import {deepFreeze} from '@/domain/portfolio/transaction';
export const CURRENT_PUBLICATION_KIND='SCORECARD';
interface Publication extends CurrentPublicationSubject {readonly contract:'current-read-only-publication-v1';readonly securityId:string;readonly asOf:string;readonly knownAt:string;readonly calculatedAt:string;readonly purpose:'CURRENT_FORMAL_VALUATION';readonly historicalPitGranted:false;readonly tradingAuthorized:false;readonly authorityReference:string;readonly authorityHash:string}
export class CurrentScorePublications implements CurrentPublishedScores {
 constructor(private readonly db:PrismaClient,private readonly source:Pick<CurrentPurposeScoring,'find'>,private readonly gate:CurrentReleaseGate){}
 private async qualified(id:string){const saved=await this.source.find(id);check(saved,'CURRENT_SCORE_REQUIRED');const c=saved.card;check(c.contract==='personal-ai-current-scorecard-v1'&&c.input.currentPurpose.purpose==='CURRENT_FORMAL_VALUATION'&&c.input.currentPurpose.economicCutoff===c.asOf.slice(0,10)&&!c.operationalAuthorizationGranted&&!saved.authorization.historicalPitGranted,'CURRENT_PUBLICATION_PURPOSE');return saved;}
 private decode(row:{body:string;bodyHash:string;id:string;kind:string;asOf:string;calculatedAt:string;methodologyId:string}){const p=JSON.parse(row.body) as Publication;check(row.kind===CURRENT_PUBLICATION_KIND&&p.contract==='current-read-only-publication-v1'&&hash(p)===row.bodyHash&&canonicalJson(p)===row.body&&p.scorecardId===row.id&&p.asOf===row.asOf&&p.calculatedAt===row.calculatedAt&&p.purpose==='CURRENT_FORMAL_VALUATION'&&p.tradingAuthorized===false&&p.historicalPitGranted===false,'CURRENT_PUBLICATION_INTEGRITY');return p;}
 async publish(id:string){
  const saved=await this.qualified(id),c=saved.card,a=saved.authorization;
  const p:Publication={contract:'current-read-only-publication-v1',scorecardId:id,scorecardHash:hash(c),datasetHash:a.datasetHash,methodologyHash:a.methodologyHash,reviewHash:a.reviewHash,securityId:c.securityId,asOf:c.asOf,knownAt:c.input.knownAt,calculatedAt:c.calculatedAt,purpose:'CURRENT_FORMAL_VALUATION',historicalPitGranted:false,tradingAuthorized:false,authorityReference:this.gate.authorityReference,authorityHash:this.gate.authorityHash};
  check(p.authorityReference.trim().length>0&&/^[a-f0-9]{64}$/.test(p.authorityHash),'CURRENT_PUBLICATION_AUTHORITY_REQUIRED');await this.gate.verify('PUBLISH',p);
  return this.db.$transaction(async tx=>{
   for(const ref of [id,a.reference.bindingId,a.dataAcceptanceId])await assertNotRevoked(tx,ref);check(p.authorityHash===this.gate.authorityHash&&p.authorityReference===this.gate.authorityReference,'CURRENT_PUBLICATION_AUTHORITY_CHANGED');await this.gate.verify('PUBLISH',p);
   const old=await tx.analyticalArtifact.findUnique({where:{id}});
   if(old){check(hash(this.decode(old))===hash(p),'CURRENT_PUBLICATION_ID_CONFLICT');return {id,duplicate:true};}
   const rows=await tx.analyticalArtifact.findMany({where:{kind:CURRENT_PUBLICATION_KIND}});
   for(const row of rows){if(JSON.parse(row.body).contract!=='current-read-only-publication-v1')continue;const other=this.decode(row);if(other.securityId===p.securityId)check(other.asOf<p.asOf||(other.asOf===p.asOf&&other.calculatedAt<p.calculatedAt),'STALE_CURRENT_PUBLICATION');}
   await tx.analyticalArtifact.create({data:{id,kind:CURRENT_PUBLICATION_KIND,methodologyId:c.methodology.methodologyId,asOf:p.asOf,calculatedAt:p.calculatedAt,body:canonicalJson(p),bodyHash:hash(p)}});return {id,duplicate:false};
  });
 }
 async find(id:string){
  const row=await this.db.analyticalArtifact.findUnique({where:{id}});if(!row)return null;
  const p=this.decode(row);await assertNotRevoked(this.db,id);check(p.authorityReference===this.gate.authorityReference&&p.authorityHash===this.gate.authorityHash,'CURRENT_PUBLICATION_AUTHORITY_CHANGED');await this.gate.verify('READ',p);
  const saved=await this.qualified(id),c=saved.card,a=saved.authorization;
  check(hash(c)===p.scorecardHash&&a.datasetHash===p.datasetHash&&a.methodologyHash===p.methodologyHash&&a.reviewHash===p.reviewHash&&row.methodologyId===c.methodology.methodologyId&&p.knownAt===c.input.knownAt&&p.securityId===c.securityId&&p.asOf===c.asOf&&p.calculatedAt===c.calculatedAt,'CURRENT_PUBLICATION_LINEAGE');
  return deepFreeze(c);
 }
 async latest(){
  const rows=await this.db.analyticalArtifact.findMany({where:{kind:CURRENT_PUBLICATION_KIND},orderBy:[{asOf:'desc'},{calculatedAt:'desc'},{id:'asc'}]});
  const seen=new Set<string>(),cards:CurrentPublishedCard[]=[];
  for(const row of rows){if(JSON.parse(row.body).contract!=='current-read-only-publication-v1')continue;const p=this.decode(row);if(seen.has(p.securityId))continue;seen.add(p.securityId);const c=await this.find(row.id);if(c)cards.push(c);}
  // A revoked/invalid newest revision fails closed; it never silently falls back to an older score.
  return deepFreeze(cards);
 }
}
