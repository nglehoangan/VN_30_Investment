// @vitest-environment node
import {it,expect} from 'vitest';
import {normalizationFixture} from '../fixtures/normalization';
import {normalizeStatement} from '@/domain/fundamentals/normalization';
import type {StatementRevision} from '@/domain/fundamentals/normalization';
import {normalizationHash} from '@/infrastructure/fundamentals/reviewed-statement';

const correction=(id:string,kind:StatementRevision['kind']='PROVIDER_CORRECTION'):StatementRevision=>({kind,recordVersion:'2',predecessorId:id,
  evidenceReference:'fixture-reviewed-correction',reason:'Explicitly reviewed transcription correction',knownAt:'2026-10-09T13:00:00.000Z',publication:null,predecessorMappingHash:null});
async function pair() {
  const a=await normalizationFixture('a'), b=await normalizationFixture('b');
  const firstExtract={...a.extract,rows:[{...a.extract.rows[0],lexicalValue:'100'}]};
  const old=normalizeStatement({...a.input,extract:firstExtract,extractHash:normalizationHash(firstExtract)}).observations[0];
  const run=(revision:StatementRevision|undefined=correction(old.id),prior=[old],patch={})=>{
    const extract={...b.extract,reviewedAt:'2026-10-09T14:00:00.000Z',rows:[{...b.extract.rows[0],lexicalValue:'110',revision}]};
    return normalizeStatement({...b.input,id:'new-run',recordedAt:'2026-10-09T15:00:00.000Z',extract,extractHash:normalizationHash(extract),prior,...patch});
  };
  return {a,b,old,run};
}
it('unknown original semantics fail closed; explicit originals cannot claim a predecessor',async()=>{
  const f=await normalizationFixture(), row={...f.extract.rows[0]};delete row.revision;
  const extract={...f.extract,rows:[row]};const r=normalizeStatement({...f.input,extract,extractHash:normalizationHash(extract)});
  expect(r.status).toBe('BLOCKED');expect(r.observations).toEqual([]);expect(r.findings[0].code).toBe('REVISION_SEMANTICS_UNRESOLVED');
  const invalid={...f.extract,rows:[{...f.extract.rows[0],revision:{...f.extract.rows[0].revision!,predecessorId:'false-predecessor'}}]};
  expect(()=>normalizeStatement({...f.input,extract:invalid,extractHash:normalizationHash(invalid)})).toThrow();
});
it('100 versus 110 without revision is blocking; a correction retains predecessor and issuer facts',async()=>{
  const {old,run}=await pair(); const original={kind:'ORIGINAL' as const,recordVersion:'1',predecessorId:null,evidenceReference:'fixture-original',reason:null,knownAt:null,publication:null,predecessorMappingHash:null};
  const conflict=run(original);expect(conflict.status).toBe('BLOCKED');expect(conflict.observations[0].quality).toBe('CONFLICTING');
  const r=run();expect(r.status).toBe('VALIDATED');expect(r.observations[0]).toMatchObject({revisionKind:'PROVIDER_CORRECTION',supersedesObservationId:old.id,ancestorReferences:[old.id],publication:old.publication});
  expect(old.normalized.value).toBe('100000000');expect(r.observations[0].availability.availableAt).toBeNull();
});
it('issuer restatement requires its own document and explicit disclosure, never local-time publication',async()=>{
  const {old,run,a}=await pair(); const v=correction(old.id,'ISSUER_RESTATEMENT');expect(()=>run(v)).toThrow();
  const publication={publishedAt:'2026-10-09T09:30:00.000Z',publicationDate:null,publicationPrecision:'TIMESTAMP' as const,publicationStatus:'VERIFIED' as const,timezone:'UTC',evidenceReference:'fixture-issuer-restatement-disclosure'};
  const r=run({...v,publication});expect(r.status).toBe('VALIDATED');expect(r.observations[0].publication).toEqual(publication);
  expect(r.observations[0].publication.publishedAt).not.toBe(r.recordedAt);expect(r.observations[0].availability.availableAt).toBeNull();
  expect(()=>run({...v,publication},[old],{candidate:a.candidate})).toThrow();
});
it('mapping correction preserves both hashes and rejects unchanged or wrong predecessor mapping',async()=>{
  const {b,old,run}=await pair();const manifest={...b.mapping.manifest,version:'corrected-2'};const mapping={manifest,hash:normalizationHash(manifest)};
  const v={...correction(old.id,'MAPPING_CORRECTION'),predecessorMappingHash:b.mapping.hash};
  const r=run(v,[old],{mapping});expect(r.status).toBe('VALIDATED');expect(r.mapping.hash).toBe(mapping.hash);
  expect(r.extract.rows[0].revision!.predecessorMappingHash).toBe(b.mapping.hash);
  expect(()=>run(v)).toThrow();expect(()=>run({...v,predecessorMappingHash:'0'.repeat(64)},[old],{mapping})).toThrow();
});
it('invalid references, incompatible identity, self-reference, future knowledge and cycles fail closed',async()=>{
  const {old,run}=await pair();expect(()=>run(correction('missing'))).toThrow();expect(()=>run(correction('new-run-net-income'))).toThrow();
  for(const patch of [{securityId:'other'},{itemId:'REVENUE'},{reportingScope:'SEPARATE_STANDALONE'},
    {periodStart:'2026-04-02'},{periodType:'YTD'},{accountingBasis:'IFRS'},{normalized:{...old.normalized,currency:'USD'}}]) {
    expect(()=>run(correction(old.id),[{...old,...patch} as typeof old])).toThrow();
  }
  expect(()=>run({...correction(old.id),knownAt:'2026-10-10T00:00:00.000Z'})).toThrow();
  expect(()=>run({...correction(old.id),evidenceReference:''})).toThrow();
  const loop={...old,revisionKind:'PROVIDER_CORRECTION' as const,supersedesObservationId:'loop',revisionReason:'fixture',revisionEvidenceReference:'fixture',correctionKnownAt:old.ingestedAt};
  const other={...loop,id:'loop',supersedesObservationId:old.id};expect(()=>run(correction(old.id),[loop,other])).toThrow();
});
it('A to B to C retains the full immutable chain; unrelated branches still conflict',async()=>{
  const {old,run}=await pair(), second=run(), b=second.observations[0];
  const extract={...second.extract,reviewedAt:'2026-10-09T16:00:00.000Z',rows:[{...second.extract.rows[0],lexicalValue:'120',revision:{...correction(b.id),knownAt:b.ingestedAt}}]};
  const patch={id:'third-run',recordedAt:'2026-10-09T17:00:00.000Z',extract,extractHash:normalizationHash(extract)};
  const c=run(correction(b.id),[old,b],patch);
  expect(c.status).toBe('VALIDATED');expect(c.observations[0].ancestorReferences).toEqual([b.id,old.id]);
  expect(run(correction(b.id),[old,b],patch)).toEqual(c);
  expect(run(correction(b.id),[old,b,{...old,id:'unrelated',normalized:{...old.normalized,value:'999'}}],patch).status).toBe('BLOCKED');
});

it('a controlled future execution clock never becomes issuer publication or availability',async()=>{
  const f=await normalizationFixture();const r=normalizeStatement({...f.input,recordedAt:'2030-01-01T00:00:00.000Z'});
  const o=r.observations[0];expect(r.recordedAt).toBe('2030-01-01T00:00:00.000Z');
  expect(o.publication.publishedAt).toBeNull();expect(o.publication.publicationDate).toBeNull();
  expect(o.reportDate).toBeNull();expect(o.providerReceivedAt).toBeNull();expect(o.availability).toMatchObject({availableAt:null,status:'UNKNOWN'});
  expect(o.retrievedAt).toBe(f.raw.retrievedAt);expect(o.periodEnd).toBe('2026-06-30');
});
