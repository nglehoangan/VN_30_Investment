// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {transcriptionDraft,researchReadiness} from '../../scripts/lib/transcription-draft.mjs';
import {parseReviewedStatement,normalizationHash} from '../../src/infrastructure/fundamentals/reviewed-statement';
import {normalizeStatement} from '../../src/domain/fundamentals/normalization';
import {requireQualifiedDocument} from '../../src/domain/fundamentals/document-qualification';
import {normalizationFixture} from '../fixtures/normalization';
import {snapshotFixture} from '../fixtures/snapshot';
import {assessAvailability} from '../../src/domain/fundamentals/availability';
import {buildFundamentalSnapshot} from '../../src/domain/fundamentals/snapshot';
import {snapshotHash} from '../../src/infrastructure/fundamentals/snapshot-hash';

const document={documentId:'a'.repeat(64),bodyHash:'b'.repeat(64),sourceVersionId:'source',importExecutionId:'batch',captureIds:['capture'],retrievedAt:'2026-10-10T00:00:00.000Z',ingestedAt:'2026-10-10T00:00:01.000Z'};
const row={sourceCaption:'Reported revenue',lexicalValue:'0',pageReference:'page:2/row:revenue',unitReference:'page:2/header:units',periodReference:'page:2/header:period',scopeReference:'page:1/title',scale:'1000000',unit:'CURRENCY',currency:'VND',periodStart:'2026-04-01',periodEnd:'2026-06-30',periodType:'QUARTER',reportingScope:'CONSOLIDATED',method:'TEXT_EXTRACTION_AID'};
describe('08B outside-canonical extraction boundary',()=>{
  it('research basket never asserts official membership',()=>{
    const r=researchReadiness([{ticker:'FPT',scope:'research_basket'}],[])[0];expect(r.officialMembershipStatus).toBe('UNKNOWN');expect(r.securityId).toBeNull();expect(r.dataReady).toBe(false);
  });
  it('supplemental historical candidate never becomes active implicitly',()=>expect(researchReadiness([{ticker:'BVH',scope:'supplemental_historical'}],[])).toEqual([]));
  it('missing ticker remains in research readiness denominator',()=>{
    const r=researchReadiness(['FPT','MCH'].map(ticker=>({ticker,scope:'research_basket'})),[{researchTicker:'FPT'}]);expect(r).toHaveLength(2);expect(r[1].rawPdfReceipts).toBe(0);expect(r[1].readyForScoring).toBe(false);
  });
  it('duplicate research identities fail rather than collapsing denominator',()=>expect(()=>researchReadiness([{ticker:'FPT'},{ticker:'FPT'}],[])).toThrow());
  it('OCR aid cannot become a reviewed canonical input',()=>{
    const d=transcriptionDraft(document,[{...row,method:'OCR_AID'}]);expect(d.canonicalAdmissionPermitted).toBe(false);expect(d.reviewerReference).toBeNull();expect(()=>parseReviewedStatement(JSON.stringify(d))).toThrow();
  });
  it('text aid cannot become a reviewed canonical input',()=>expect(()=>parseReviewedStatement(JSON.stringify(transcriptionDraft(document,[row])))).toThrow());
  it('zero lexical string differs from missing',()=>{
    const d=transcriptionDraft(document,[row,{...row,lexicalValue:null}]);expect(d.rows.map(r=>r.lexicalValue)).toEqual(['0',null]);
  });
  it('numeric cells cannot silently pass through floating point',()=>expect(()=>transcriptionDraft(document,[{...row,lexicalValue:9007199254740992}])).toThrow());
  it('unknown units remain explicit null',()=>expect(transcriptionDraft(document,[{...row,scale:null,unitReference:null,currency:null}]).rows[0].scale).toBeNull());
  it('filename-only evidence is rejected by aid row boundary',()=>expect(()=>transcriptionDraft(document,[{...row,pageReference:'FPT_Q2_2026.pdf'}])).toThrow());
  it('HTML-only evidence is rejected by aid row boundary',()=>expect(()=>transcriptionDraft(document,[{...row,pageReference:'https://fpt.com/vi/nha-dau-tu'}])).toThrow());
  it('missing raw lineage cannot enter transcription queue',()=>expect(()=>transcriptionDraft({...document,captureIds:[]},[row])).toThrow());
  it('undeclared approval/reviewer fields are rejected',()=>expect(()=>transcriptionDraft(document,[{...row,reviewerReference:'self-approved'}])).toThrow());
  it('transcription method cannot self-declare reviewed authority',()=>expect(()=>transcriptionDraft(document,[{...row,method:'REVIEWED_TRANSCRIPTION'}])).toThrow());
  it('draft retains lexical evidence and protects its hash against caller mutation',()=>{
    const r={...row},d=transcriptionDraft(document,[r]);r.lexicalValue='99';expect(d.rows[0].lexicalValue).toBe('0');expect(d.draftHash).not.toBe(transcriptionDraft(document,[r]).draftHash);
  });
  it('wrong issuer fails the existing Slice02 gate',async()=>{
    const f=await normalizationFixture();expect(()=>requireQualifiedDocument(f.raw,[f.qualification],{...f.qualification.intendedIssuer,ticker:'VCB'})).toThrow();
  });
  it('wrong period remains blocked through existing normalization',async()=>{
    const f=await normalizationFixture(),extract={...f.extract,rows:[{...f.extract.rows[0],periodEnd:'2026-09-30'}]};expect(normalizeStatement({...f.input,extract,extractHash:normalizationHash(extract)}).status).toBe('BLOCKED');
  });
  it('standalone/consolidated mismatch remains blocked',async()=>{
    const f=await normalizationFixture(),extract={...f.extract,rows:[{...f.extract.rows[0],reportingScope:'SEPARATE_STANDALONE'}]};expect(normalizeStatement({...f.input,extract,extractHash:normalizationHash(extract)}).status).toBe('BLOCKED');
  });
  it('proposed releases cannot authorize FORMAL normalization',async()=>{
    const f=await normalizationFixture();expect(()=>normalizeStatement({...f.input,scope:'FORMAL'})).toThrow();
  });
  it('October retrieval cannot create June historical knowledge or snapshot membership',()=>{
    const f=snapshotFixture(),observation={...f.observation,providerReceivedAt:null,providerReceiptReference:null,
      publication:{publishedAt:'2026-06-30T09:00:00.000Z',publicationDate:null,publicationPrecision:'TIMESTAMP',publicationStatus:'VERIFIED',timezone:'UTC',evidenceReference:'synthetic-june-disclosure'},
      retrievedAt:'2026-10-10T09:00:00.000Z',ingestedAt:'2026-10-10T09:01:00.000Z'};
    const assessment=assessAvailability({id:'october-local-knowledge',observation,registry:f.registry,policy:f.policy,assessedAt:'2026-10-10T10:00:00.000Z',hash:snapshotHash});
    expect(assessment.availableAt).toBe('2026-10-10T09:01:00.000Z');
    const cutoff='2026-06-30T23:59:59.999Z',request={...f.request,decisionAsOf:cutoff,systemKnownAt:cutoff,marketCutoff:cutoff,fundamentalCutoff:cutoff,assessmentPins:[],builtAt:'2026-10-10T10:01:00.000Z'};
    const snapshot=buildFundamentalSnapshot(request,{...f.inputs,observations:[observation],assessments:[assessment]},snapshotHash);
    expect(snapshot.members).toEqual([]);expect(snapshot.blockers).toContain('BLOCKED_REQUIRED_FACT_MISSING');
  });
  it('review tooling composes no write, network, scoring or decision capability',()=>{
    const source=readFileSync(new URL('../../scripts/prepare-08b-review.mjs',import.meta.url),'utf8');
    expect(source).toContain('readOnly:true');expect(source).toContain('PRAGMA query_only=ON');expect(source).not.toMatch(/appendObservation|appendImport|fetch\(|calculateScorecard|rankScorecards|PrismaClient|process\.loadEnvFile|INSERT INTO|UPDATE /);
  });
});
