import { FptDocumentCollector } from '@/infrastructure/fundamentals/fpt';
import { RepositoryRawDocuments } from '@/infrastructure/fundamentals/raw-document';
import { loadStatementMapping, normalizationHash } from '@/infrastructure/fundamentals/reviewed-statement';
import { requireQualifiedDocument } from '@/domain/fundamentals/document-qualification';
import type { DocumentQualification } from '@/domain/fundamentals/document-qualification';
import { securityId } from '@/domain/portfolio/values';
import { normalizeStatement } from '@/domain/fundamentals/normalization';
import type { StatementExtract } from '@/domain/fundamentals/normalization';
import type { FundamentalRepository } from '@/ports/fundamentals';
import { release } from './fundamentals';

export const normalizationIssuer = {securityId:securityId('test-issuer'),ticker:'FPT',issuerReference:'fixture-security:FPT-Corporation'};
export async function normalizationFixture(suffix='1') {
  const collection = await new FptDocumentCollector({reportUrls:['https://fpt.com/api/media/FPT_BCTC_Q2_TEST.pdf']},{
    request:async url=>new Response(url.endsWith('.pdf') ? '%PDF-1.7\nSYNTHETIC ONLY' : '<div>dynamic</div>',
      {headers:{'content-type':url.endsWith('.pdf') ? 'application/pdf' : 'text/html'}}),
    now:()=> '2026-10-09T10:00:00.000Z',sleep:async()=>{},
  }).collect(`test-batch-${suffix}`);
  const repository: FundamentalRepository = {appendSource:async()=>{},appendImport:async()=>{},appendObservation:async()=>{},
    findSource:async()=>collection.source,findImport:async()=>collection.batch,findObservation:async()=>null,
    findCapture:async id=>collection.captures.find(c=>c.id===id) ?? null};
  const ids = collection.captures.filter(c=>c.resourceReference.endsWith('.pdf')).map(c=>c.id);
  const raw = await new RepositoryRawDocuments(repository).reconstruct(ids);
  const qualification: DocumentQualification = {id:`test-qualification-${suffix}`,documentId:raw.documentId,bodyHash:raw.bodyHash,
    sourceVersionId:raw.sourceVersionId,importExecutionId:raw.importExecutionId,captureIds:ids,intendedIssuer:normalizationIssuer,evidencedIssuer:normalizationIssuer,
    documentType:'FINANCIAL_STATEMENTS',period:{start:'2026-04-01',end:'2026-06-30',type:'QUARTER',fiscalYear:2026,fiscalQuarter:2,calendarReference:'fixture-calendar'},
    reportingScope:'CONSOLIDATED',status:'QUALIFIED',method:'DOCUMENT_CONTENT_REVIEW',
    evidence:(['ISSUER_IDENTITY','DOCUMENT_TYPE','REPORTING_PERIOD','REPORTING_SCOPE'] as const).map(dimension=>
      ({dimension,reference:'fixture-review',locator:'page:1',bodyHash:raw.bodyHash})),
    reviewedAt:'2026-10-09T11:00:00.000Z',reviewerReference:'fixture-reviewer',policyVersion:'manual-document-v1',supersedesQualificationId:null,correctionReason:null};
  const candidate = requireQualifiedDocument(raw,[qualification],normalizationIssuer);
  const extract: StatementExtract = {id:`test-extract-${suffix}`,documentId:raw.documentId,bodyHash:raw.bodyHash,qualificationId:qualification.id,
    reviewerReference:'fixture-extract-reviewer',reviewedAt:'2026-10-09T12:00:00.000Z',method:'REVIEWED_TRANSCRIPTION',sector:'TECHNOLOGY',sectorReference:'fixture-sector:TECHNOLOGY',accountingBasis:'VAS',auditStatus:'UNAUDITED',
    rows:[{id:'net-income',fieldId:'reviewed.netIncome',label:'Reviewed total profit after tax',sourceLabel:'Synthetic reported total NPAT',
      locator:'page:2/row:profit/column:current',definitionLocator:'page:2/note:total-profit-definition',
      unitLocator:'page:2/header:unit',periodLocator:'page:2/header:period',lexicalValue:'15.123,5',unit:'MILLION_CURRENCY',currency:'VND',
      reportingScope:'CONSOLIDATED',periodStart:'2026-04-01',periodEnd:'2026-06-30',periodType:'QUARTER'}]};
  const mapping = loadStatementMapping(release);
  const input = {id:`normalization-${suffix}`,scope:'SYNTHETIC_TEST' as const,recordedAt:'2026-10-09T13:00:00.000Z',candidate,
    extract,extractHash:normalizationHash(extract),mapping,registry:release,prior:[],hash:normalizationHash};
  return {collection,repository,raw,ids,qualification,candidate,extract,mapping,input,result:()=>normalizeStatement(input)};
}
