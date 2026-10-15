// @vitest-environment node
import {it,expect} from 'vitest';
import {normalizationFixture} from '../fixtures/normalization';
import {requireQualifiedDocument,validateDocumentQualification} from '@/domain/fundamentals/document-qualification';
import {normalizeStatement,normalizeLexical} from '@/domain/fundamentals/normalization';
import {loadCanonicalRegistry} from '@/infrastructure/fundamentals/canonical-registry';
it('financial disclosures still require exact issuer, period, scope and all four source evidence dimensions',async()=>{
 const f=await normalizationFixture(),q={...f.qualification,documentType:'FINANCIAL_DISCLOSURE' as const};
 expect(requireQualifiedDocument(f.raw,[q],q.intendedIssuer).qualification.documentType).toBe('FINANCIAL_DISCLOSURE');
 const point={...q,period:{...q.period!,start:q.period!.end,type:'INSTANT' as const,fiscalQuarter:null}};expect(validateDocumentQualification(point).period?.start).toBe(q.period!.end);
 expect(()=>validateDocumentQualification({...point,period:{...point.period,start:q.period!.start}})).toThrow();
 expect(()=>validateDocumentQualification({...point,documentType:'FINANCIAL_STATEMENTS'})).toThrow();
 expect(()=>validateDocumentQualification({...q,documentType:'OTHER'})).toThrow();
 expect(()=>validateDocumentQualification({...q,evidence:q.evidence.slice(1)})).toThrow();
 expect(()=>requireQualifiedDocument({...f.raw,bodyHash:'a'.repeat(64)},[q],q.intendedIssuer)).toThrow();
});
it('point-in-time financial ratios retain their date and percent scale without admitting instant income',async()=>{
 const f=await normalizationFixture(),hash=f.input.hash,row=f.extract.rows[0],point={...row,periodType:'INSTANT' as const,periodStart:row.periodEnd};
 const bad={...f.extract,rows:[point]};expect(normalizeStatement({...f.input,extract:bad,extractHash:hash(bad)}).observations).toHaveLength(0);
 const template=f.input.registry.manifest.items.find(i=>i.itemId==='NET_INCOME')!;
 const registry=loadCanonicalRegistry({...f.input.registry.manifest,registryVersion:'synthetic-point-ratio-v1',items:[{...template,itemId:'TEST_POINT_RATIO',name:'Synthetic point ratio',meaning:'Synthetic dated ratio',statementType:'SUPPLEMENTARY',measurementSemantic:'RATIO',allowedUnits:['RATIO'],currencyApplicability:'NONE',operandMappings:[],evidenceTopicMappings:[]}]});
 const field=f.mapping.manifest.fields.find(x=>x.fieldId===row.fieldId)!,mappingManifest={...f.mapping.manifest,fields:[{...field,itemId:'TEST_POINT_RATIO',unit:'PERCENT',currency:null,format:'EN' as const}]};
 const extract={...f.extract,rows:[{...point,lexicalValue:'8.5%',unit:'PERCENT',currency:null}]};
 const n=normalizeStatement({...f.input,registry,mapping:{manifest:mappingManifest,hash:hash(mappingManifest)},extract,extractHash:hash(extract)});
 expect(n.observations).toHaveLength(1);expect(n.observations[0]).toMatchObject({periodStart:row.periodEnd,periodEnd:row.periodEnd,periodType:'INSTANT',measurementSemantic:'RATIO',normalized:{value:'0.085',unit:'RATIO',currency:null}});
});

it('normalizes an explicitly disclosed trillion currency scale without rounding the source decimal',()=>{
 expect(normalizeLexical('267.0',{format:'EN',unit:'TRILLION_CURRENCY',sign:'IDENTITY',missingTokens:[]})).toEqual({value:'267000000000000',state:'AVAILABLE',code:null});
 expect(normalizeLexical('267,0',{format:'EN',unit:'TRILLION_CURRENCY',sign:'IDENTITY',missingTokens:[]}).state).toBe('INVALID');
});
