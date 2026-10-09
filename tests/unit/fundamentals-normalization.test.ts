// @vitest-environment node
import { describe,it,expect } from 'vitest';
import { normalizeLexical,normalizeStatement,validateStatementMapping } from '@/domain/fundamentals/normalization';
import { parseReviewedStatement,normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import { normalizationFixture } from '../fixtures/normalization';
import { requireQualifiedDocument } from '@/domain/fundamentals/document-qualification';

const scalar = (value:string|null,unit='MILLION_CURRENCY',format:'VI'|'EN'|'CANONICAL'='VI',sign:'IDENTITY'|'NEGATE_NONPOSITIVE'='IDENTITY')=>
  normalizeLexical(value,{unit,format,sign,missingTokens:['-','—']});
describe('exact lexical normalization, no financial adjustments',()=>{
  it('independent million-VND/percent expected values reconcile with exact arithmetic',()=>{
    expect(scalar('1.234,5').value).toBe('1234500000');
    expect(scalar('2,5%','PERCENT').value).toBe('0.025');
    expect(scalar('2.5%','PERCENT','EN').value).toBe('0.025');
    expect(scalar('1,234.50','CURRENCY','EN').value).toBe('1234.5');
    expect(scalar('9007199254740993','CURRENCY','CANONICAL').value).toBe('9007199254740993');
  });
  it('keeps zero distinct from missing and permits economically possible negative profit/CFO',()=>{
    expect(scalar('0').value).toBe('0'); expect(scalar(null).state).toBe('MISSING');
    expect(scalar('-').value).toBeNull(); expect(scalar('—').state).toBe('MISSING');
    expect(scalar('-15,5').value).toBe('-15500000'); expect(scalar('(15,5)').value).toBe('-15500000');
    expect(scalar('')).toMatchObject({value:null,state:'INVALID'});
    expect(normalizeLexical('0',{unit:'CURRENCY',format:'CANONICAL',sign:'IDENTITY',missingTokens:['0']}).state).toBe('INVALID');
  });
  it('rejects wrong locale, grouping, exponent, undeclared percentage, unknown unit and precision loss',()=>{
    for (const value of ['1,234.5','1.23.456','1e6','NaN','1 234','--1','(-1)']) expect(scalar(value).state).toBe('INVALID');
    expect(scalar('10%').state).toBe('INVALID');expect(scalar('1','UNKNOWN').state).toBe('INVALID');
    expect(scalar('0.000000000001','PERCENT','CANONICAL').state).toBe('INVALID');
    expect(scalar('9'.repeat(30),'BILLION_CURRENCY','CANONICAL').state).toBe('INVALID');
  });
  it('capex sign changes require explicit nonpositive-source policy; positive source sign is not guessed',()=>{
    expect(scalar('-10','MILLION_CURRENCY','VI','NEGATE_NONPOSITIVE').value).toBe('10000000');
    expect(scalar('10','MILLION_CURRENCY','VI','NEGATE_NONPOSITIVE').state).toBe('INVALID');
  });
  it('produces canonical observations only from qualified, hash-bound reviewed extracts',async()=>{
    const f=await normalizationFixture(), result=f.result();
    expect(result.status).toBe('VALIDATED');expect(result.observations[0].normalized.value).toBe('15123500000');
    expect(result.observations[0].raw.lexicalValue).toBe('15.123,5');expect(result.observations[0].availability.availableAt).toBeNull();
    expect(result.observations[0].publication.publicationPrecision).toBe('UNKNOWN');expect(result.observations[0].reportDate).toBeNull();
    expect(Object.isFrozen(result.observations[0])).toBe(true);
    expect(()=>normalizeStatement({...f.input,extractHash:'0'.repeat(64)})).toThrow();
    expect(()=>normalizeStatement({...f.input,scope:'FORMAL'})).toThrow();
    expect(()=>normalizeStatement({...f.input,candidate:{...f.candidate,qualification:{...f.qualification,status:'REJECTED'}}})).toThrow();
  });
  it('unknown fields, label mismatch, wrong unit/currency and scope are retained as blocking findings',async()=>{
    const f=await normalizationFixture();
    for(const [patch,code] of [[{fieldId:'netProfit'},'UNKNOWN_FIELD_MAPPING'],[{label:'Profit attributable to parent'},'MAPPING_LABEL_MISMATCH'],
      [{unit:'BILLION_CURRENCY'},'SOURCE_UNIT_MISMATCH'],[{currency:'USD'},'SOURCE_CURRENCY_MISMATCH'],[{reportingScope:'SEPARATE_STANDALONE'},'REPORTING_SCOPE_MISMATCH']] as const) {
      const extract={...f.extract,rows:[{...f.extract.rows[0],...patch}]};
      const r=normalizeStatement({...f.input,extract,extractHash:normalizationHash(extract)});
      expect(r.status).toBe('BLOCKED');expect(r.findings[0].code).toBe(code);expect(r.extract.rows[0]).toEqual(extract.rows[0]);
    }
  });
  it('YTD/quarter/annual are not interchanged, stock is an instant and missing is never zero',async()=>{
    const f=await normalizationFixture();
    const run=(row:typeof f.extract.rows[number])=>{const extract={...f.extract,rows:[row]};return normalizeStatement({...f.input,extract,extractHash:normalizationHash(extract)});};
    expect(run({...f.extract.rows[0],periodStart:'2026-01-01',periodType:'YTD'}).status).toBe('BLOCKED');
    expect(run({...f.extract.rows[0],periodType:'ANNUAL'}).status).toBe('BLOCKED');
    const missing=run({...f.extract.rows[0],lexicalValue:null});expect(missing.status).toBe('PARTIAL');
    expect(missing.observations[0]).toMatchObject({dataPresence:'MISSING',quality:'UNKNOWN',normalized:{value:null}});
    const assets={...f.extract.rows[0],id:'assets',fieldId:'reviewed.totalAssets',label:'Reviewed total assets',lexicalValue:'100',periodType:'INSTANT' as const,periodStart:'2026-06-30'};
    expect(run(assets).observations[0].measurementSemantic).toBe('STOCK');
    expect(run({...assets,lexicalValue:'-1'}).status).toBe('BLOCKED');
  });
  it('retains competing values as conflicts, equivalent receipts remain distinct; future context is rejected',async()=>{
    const f=await normalizationFixture(), prior=f.result().observations[0];
    const x={...f.extract,rows:[{...f.extract.rows[0],lexicalValue:'1'}]};
    const conflict=normalizeStatement({...f.input,id:'conflict',extract:x,extractHash:normalizationHash(x),prior:[prior]});
    expect(conflict.status).toBe('BLOCKED');expect(conflict.observations[0].quality).toBe('CONFLICTING');
    expect(conflict.findings[0].relatedObservationIds).toEqual([prior.id]);expect(prior.quality).toBe('VALID');
    expect(normalizeStatement({...f.input,id:'same-value',prior:[prior]}).status).toBe('VALIDATED');
    expect(()=>normalizeStatement({...f.input,prior:[{...prior,ingestedAt:'2026-10-10T13:00:00.000Z'}]})).toThrow();
  });
  it('preserves independently reviewed native YTD/quarter columns and separate scope without deriving values',async()=>{
    const f=await normalizationFixture();
    const q={...f.qualification,id:'covered-ytd',period:{...f.qualification.period!,start:'2026-01-01',type:'YTD' as const},reportingScope:'SEPARATE_STANDALONE' as const};
    const candidate=requireQualifiedDocument(f.raw,[q],q.intendedIssuer);
    const quarter={...f.extract.rows[0],reportingScope:'SEPARATE_STANDALONE' as const};
    const ytd={...quarter,id:'ytd-income',locator:'page:2/row:profit/column:ytd',periodStart:'2026-01-01',periodType:'YTD' as const,lexicalValue:'20.000'};
    const extract={...f.extract,qualificationId:q.id,rows:[quarter,ytd]};
    const result=normalizeStatement({...f.input,candidate,extract,extractHash:normalizationHash(extract)});
    expect(result.status).toBe('VALIDATED');
    expect(result.observations.map(o=>[o.periodType,o.normalized.value,o.reportingScope])).toEqual([
      ['QUARTER','15123500000','SEPARATE_STANDALONE'],['YTD','20000000000','SEPARATE_STANDALONE']]);
  });
  it('foreign currency is retained when explicitly mapped, and no currency relabeling/FX occurs',async()=>{
    const f=await normalizationFixture();
    const manifest={...f.mapping.manifest,fields:f.mapping.manifest.fields.map(m=>({...m,currency:'USD'}))};
    const mapping={manifest,hash:normalizationHash(manifest)},extract={...f.extract,rows:[{...f.extract.rows[0],currency:'USD'}]};
    const result=normalizeStatement({...f.input,mapping,extract,extractHash:normalizationHash(extract)});
    expect(result.observations[0].normalized.currency).toBe('USD');expect(result.observations[0].fxLineageReference).toBeNull();
  });
  it('reviewed JSON rejects numeric lexical cells and undeclared metadata instead of coercing',async()=>{
    const f=await normalizationFixture();expect(parseReviewedStatement(JSON.stringify(f.extract))).toEqual(f.extract);
    expect(()=>parseReviewedStatement(JSON.stringify({...f.extract,rows:[{...f.extract.rows[0],lexicalValue:9000}]}))).toThrow();
    expect(()=>parseReviewedStatement(JSON.stringify({...f.extract,availableAt:'2026-06-30'}))).toThrow();
    expect(()=>validateStatementMapping({...f.mapping.manifest,fields:f.mapping.manifest.fields.map(m=>({...m,missingTokens:['0']}))},f.input.registry)).toThrow();
  });
});
