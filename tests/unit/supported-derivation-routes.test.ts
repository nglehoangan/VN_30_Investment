// @vitest-environment node
import {it,expect} from 'vitest';
import {proposeSecuritiesRoeRoute} from '@/domain/fundamentals/supported-derivation-routes';
import {deriveFundamentals} from '@/domain/fundamentals/derivation';
import {derivationFixture,derivationFact} from '../fixtures/derivation';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
it('adds only the approved securities ROE formula as a proposed route without inventing bank or industrial substitutes',()=>{
 const f=derivationFixture(),proposal=proposeSecuritiesRoeRoute(f.crosswalk,f.registry,f.recordedAt);expect(proposal.governanceStatus).toBe('PROPOSED');expect(proposal.approvalReference).toBeNull();expect(proposal.routes.filter(r=>r.sector==='SECURITIES').map(r=>r.metric)).toEqual(['ROE']);expect(proposal.routes.slice(0,-1)).toEqual(f.crosswalk.routes);
});
it('existing engine executes securities ROE with reviewed common profit and compatible equity endpoints in isolated fixtures',()=>{
 const f=derivationFixture(),crosswalk=proposeSecuritiesRoeRoute(f.crosswalk,f.registry,f.recordedAt);
 const profit={...derivationFact('sec-profit','NET_INCOME_ATTRIBUTABLE_COMMON','24'),sector:'SECURITIES' as const};
 const begin={...derivationFact('sec-begin','COMMON_EQUITY','100'),sector:'SECURITIES' as const,periodType:'INSTANT' as const,periodStart:'2026-03-31',periodEnd:'2026-03-31',fiscalQuarter:1 as const};
 const end={...derivationFact('sec-end','COMMON_EQUITY','140'),sector:'SECURITIES' as const,periodType:'INSTANT' as const,periodStart:'2026-06-30',periodEnd:'2026-06-30'};
 const request={...f.request,sector:'SECURITIES' as const,metric:'ROE' as const,operands:[{id:'profit-operand',operation:'HUMAN_NORMALIZED' as const,observationIds:[profit.id],adjustment:{id:'synthetic-normalization',reviewerReference:'synthetic-only',reviewedAt:f.recordedAt,evidenceReference:'synthetic-evidence',rationale:'Synthetic reviewed nonrecurring gain',amount:'-6',unit:'CURRENCY' as const,currency:'VND',adjustmentKind:'NON_RECURRING_GAIN' as const,confidence:'MEDIUM' as const}},{id:'equity-operand',operation:'AVERAGE_ENDPOINTS' as const,observationIds:[begin.id,end.id],adjustment:null}]};
 const result=deriveFundamentals({...f,request,crosswalk,crosswalkHash:normalizationHash(crosswalk),observations:[profit,begin,end]});expect(result.value).toBe('0.15');expect(result.availability.status).toBe('UNKNOWN');
 expect(()=>deriveFundamentals({...f,request:{...request,operands:[{...request.operands[0],adjustment:null},request.operands[1]]},crosswalk,crosswalkHash:normalizationHash(crosswalk),observations:[profit,begin,end]})).toThrow();
});
it('missing registry applicability and duplicate route proposals fail closed',()=>{
 const f=derivationFixture(),registry=loadCanonicalRegistry({...f.registry.manifest,items:f.registry.manifest.items.map(i=>i.itemId==='COMMON_EQUITY'?{...i,sectorApplicability:i.sectorApplicability.filter(s=>s!=='SECURITIES')}:i)});
 expect(()=>proposeSecuritiesRoeRoute({...f.crosswalk,registryHash:registry.registryHash},registry,f.recordedAt)).toThrow();const proposal=proposeSecuritiesRoeRoute(f.crosswalk,f.registry,f.recordedAt);expect(()=>proposeSecuritiesRoeRoute(proposal,f.registry,f.recordedAt)).toThrow();
});
