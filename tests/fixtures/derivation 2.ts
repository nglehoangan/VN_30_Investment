import { fundamentalFixture,release } from './fundamentals';
import { loadDerivationCrosswalk } from '@/infrastructure/fundamentals/derivation-crosswalk';
import { normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import type { FundamentalObservation } from '@/domain/fundamentals/contracts';
import type { DerivationRequest } from '@/domain/fundamentals/derivation';
export function derivationFact(id:string,itemId='CFO',value='100'):FundamentalObservation{
  const o=fundamentalFixture(id).observation,item=release.manifest.items.find(i=>i.itemId===itemId)!;
  return {...o,id,itemId,statementType:item.statementType,measurementSemantic:item.measurementSemantic,
    reportDate:null,reportDateReference:null,publication:{publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null},
    normalized:{...o.normalized,value},raw:{...o.raw,lexicalValue:value,unit:'CURRENCY',multiplier:'1'}};
}
export function derivationFixture(){
  const observations=[derivationFact('cfo'),derivationFact('capex','CAPEX','30')];
  const request:DerivationRequest={id:'derived-fcf',scope:'SYNTHETIC_TEST',securityId:observations[0].securityId,sector:'TECHNOLOGY',metric:'FCF',
    periodStart:'2026-04-01',periodEnd:'2026-06-30',cyclical:false,operands:observations.map(o=>({id:`operand-${o.id}`,operation:'REPORTED',observationIds:[o.id],adjustment:null}))};
  const c=loadDerivationCrosswalk(release);
  return {request,recordedAt:'2026-10-09T13:00:00.000Z',registry:release,crosswalk:c.crosswalk,crosswalkHash:c.hash,observations,hash:normalizationHash};
}
