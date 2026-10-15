// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { fundamentalFixture,release } from '../fixtures/fundamentals';
import { validateCanonicalRegistry,validateFundamentalObservation,validateFundamentalCapture } from '@/domain/fundamentals/validation';
import { loadCanonicalRegistry,verifyRegistryApproval } from '@/infrastructure/fundamentals/canonical-registry';
import { methodologyFixture } from '../fixtures/methodology';
import type { FundamentalObservation,CanonicalRegistry } from '@/domain/fundamentals/contracts';
const observation=()=>fundamentalFixture().observation;
const validate=(o:FundamentalObservation)=>validateFundamentalObservation(o,release);
describe('foundational canonical contracts, no calculations',()=>{
  it('preserves Q2 period, signing/public/provider/local receipt independently with UNKNOWN availability',()=>{
    const o=validate(observation());expect(o.periodEnd).toBe('2026-06-30');expect(o.reportDate).toBe('2026-07-22');expect(o.publication.publishedAt).toBe('2026-07-25T09:00:00.000Z');expect(o.providerReceivedAt).toBe('2026-07-25T10:00:00.000Z');expect(o.retrievedAt).toBe('2026-07-26T09:00:00.000Z');expect(o.availability.availableAt).toBeNull();expect(Object.isFrozen(o.publication)).toBe(true);
    // The selector and July-10 admissibility assertion belong to Slice 5, not an invented Slice 1 result.
  });
  it('preserves true zero, negative earnings and exact values above JS safe integer',()=>{
    for(const value of ['0','-100','9007199254740993.123456789012'])expect(validate({...observation(),normalized:{value,unit:'CURRENCY',currency:'VND'}}).normalized.value).toBe(value);
  });
  it('missing and invalid raw values remain auditable without zero replacement',()=>{
    const o=observation();expect(validate({...o,dataPresence:'MISSING',quality:'UNKNOWN',raw:{...o.raw,lexicalValue:null},normalized:{...o.normalized,value:null}}).normalized.value).toBeNull();
    expect(validate({...o,quality:'INVALID',raw:{...o.raw,lexicalValue:'not a number'},normalized:{...o.normalized,value:null}}).raw.lexicalValue).toBe('not a number');
    expect(()=>validate({...o,dataPresence:'MISSING',normalized:{...o.normalized,value:'0'}})).toThrow();
  });
  it('unknown and date-only publication never turn into timestamps',()=>{
    const o=observation();const unknown={publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null} as const;
    expect(validate({...o,publication:unknown}).publication.publishedAt).toBeNull();
    const dateOnly={publishedAt:null,publicationDate:'2026-07-25',publicationPrecision:'DATE_ONLY',publicationStatus:'VERIFIED',timezone:'Asia/Ho_Chi_Minh',evidenceReference:'fixture-date-only'} as const;
    expect(validate({...o,publication:dateOnly}).publication.publicationDate).toBe('2026-07-25');
    expect(()=>validate({...o,publication:{...dateOnly,publishedAt:'2026-07-25T00:00:00.000Z'}})).toThrow();
    expect(()=>validate({...o,publication:{...unknown,publicationDate:'2026-06-30'}})).toThrow();
  });
  it('rejects forged admissibility, chronology and extra credential fields',()=>{
    const o=observation();
    for(const patch of [{availability:{...o.availability,availableAt:'2026-06-30T00:00:00.000Z',status:'VERIFIED'}},{ingestedAt:'2026-07-25T00:00:00.000Z'},{periodStart:'2026-08-01'},{providerReceivedAt:'2026-07-24T00:00:00.000Z'},{apiKey:'secret'}])expect(()=>validate({...o,...patch} as FundamentalObservation)).toThrow();
    expect(()=>validateFundamentalCapture({...fundamentalFixture().capture,resourceReference:'https://example.invalid?token=secret'})).toThrow();
  });
  it('rejects arbitrary aliases, wrong registry identity and semantic/unit/sign mismatches',()=>{
    const o=observation();for(const itemId of ['netProfit','profitAfterTax','netIncome','NPAT'])expect(()=>validate({...o,itemId})).toThrow();
    for(const patch of [{registryHash:'0'.repeat(64)},{raw:{...o.raw,unit:'UNKNOWN_UNIT'}},{raw:{...o.raw,multiplier:'1'}},{measurementSemantic:'STOCK'},{normalized:{...o.normalized,unit:'RATIO'}},{periodType:'INSTANT'},{normalized:{...o.normalized,value:'1e6'}}])expect(()=>validate({...o,...patch} as FundamentalObservation)).toThrow();
    const assets={...o,itemId:'TOTAL_ASSETS',statementType:'BALANCE',measurementSemantic:'STOCK',periodStart:o.periodEnd,periodType:'INSTANT',normalized:{...o.normalized,value:'-1'}} as FundamentalObservation;
    expect(()=>validate(assets)).toThrow();expect(validate({...assets,normalized:{...assets.normalized,value:'0'}}).periodType).toBe('INSTANT');expect(()=>validate({...assets,periodType:'QUARTER'})).toThrow();
  });
  it('preserves separate scope and foreign currency without silently substituting/converting',()=>{
    const o=observation();expect(validate({...o,reportingScope:'SEPARATE_STANDALONE'}).reportingScope).toBe('SEPARATE_STANDALONE');
    expect(validate({...o,raw:{...o.raw,currency:'USD'},normalized:{...o.normalized,currency:'USD'}}).normalized.currency).toBe('USD');
    expect(()=>validate({...o,raw:{...o.raw,currency:'USD'}})).toThrow();expect(()=>validate({...o,fxLineageReference:'fx'})).toThrow();
    expect(()=>validate({...o,reportingScope:'SEPARATE_STANDALONE',scopeFallback:{requestedScope:'CONSOLIDATED',approvalReference:'',rationale:'fill missing'}})).toThrow();
    expect(()=>validate({...o,reportingScope:'SEPARATE_STANDALONE',scopeFallback:{requestedScope:'CONSOLIDATED',approvalReference:'fixture-only-approved-route',rationale:'explicit'}})).toThrow();
    expect(validate({...o,quality:'WARNING',reportingScope:'SEPARATE_STANDALONE',scopeFallback:{requestedScope:'CONSOLIDATED',approvalReference:'fixture-only-approved-route',rationale:'explicit'}}).quality).toBe('WARNING');
  });
  it('requires full immutable revision provenance for each correction kind',()=>{
    const o=observation();for(const revisionKind of ['ISSUER_RESTATEMENT','PROVIDER_CORRECTION','MAPPING_CORRECTION'] as const){
      expect(()=>validate({...o,revisionKind})).toThrow();expect(validate({...o,id:'revised',revisionKind,supersedesObservationId:o.id,revisionReason:'test-only-correction',revisionEvidenceReference:'test-only-proof',correctionKnownAt:o.ingestedAt}).revisionKind).toBe(revisionKind);
    }
    expect(()=>validate({...o,supersedesObservationId:'other'})).toThrow();
  });
  it('validates the machine-readable crosswalk without inventing executable operands',()=>{
    expect(release.manifest.items).toHaveLength(8);expect(release.manifest.governanceStatus).toBe('PROPOSED');
    const r=structuredClone(release.manifest);const bad={...r,items:r.items.map((item,i)=>i?item:{...item,operandMappings:[{metricId:'ROE',position:0,operand:'netIncome',requirement:'bad alias'}]})};
    expect(()=>validateCanonicalRegistry(bad)).toThrow();
    expect(()=>validateCanonicalRegistry({...r,items:[...r.items,r.items[0]]})).toThrow();
    expect(()=>validate({...observation(),scope:'FORMAL'})).toThrow();
  });
  it('binds external approval to exact release hash, crosswalk and stored method metadata',()=>{
    const approved=loadCanonicalRegistry({...release.manifest,governanceStatus:'APPROVED',approvalReference:'TEST-ONLY approval fixture'} as CanonicalRegistry);
    const binding={registryHash:approved.registryHash,crosswalkVersion:approved.manifest.crosswalkVersion,methodologyIdentity:approved.manifest.methodologyIdentity,approvalReference:approved.manifest.approvalReference!};
    const method={...methodologyFixture(),methodologyId:approved.manifest.methodologyIdentity as never,configurationReference:`registry-sha256:${approved.registryHash}`,governanceStatus:'APPROVED' as const,intendedUse:'PRODUCTION' as const,approvalReference:binding.approvalReference};
    expect(()=>verifyRegistryApproval(approved,binding,method)).not.toThrow();
    expect(()=>verifyRegistryApproval(approved,{...binding,registryHash:release.registryHash},method)).toThrow();
    expect(()=>verifyRegistryApproval(approved,binding,{...method,configurationReference:'unbound'})).toThrow();expect(()=>verifyRegistryApproval(release,null,null)).toThrow();
  });
});
