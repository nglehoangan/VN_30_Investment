// @vitest-environment node
import {it,expect} from 'vitest';
import {normalizationFixture} from '../fixtures/normalization';
import {normalizeStatement} from '@/domain/fundamentals/normalization';
it('comparative columns require exact independent source evidence and preserve the source fiscal period',async()=>{
 const f=await normalizationFixture(),hash=f.input.hash,row=f.input.extract.rows[0],prior={...row,periodStart:'2025'+row.periodStart.slice(4),periodEnd:'2025'+row.periodEnd.slice(4)};
 const noProof={...f.input.extract,rows:[prior]};const blocked=normalizeStatement({...f.input,extract:noProof,extractHash:hash(noProof)});expect(blocked.findings.some(x=>x.code==='REPORTING_PERIOD_MISMATCH')).toBe(true);
 const period={start:prior.periodStart,end:prior.periodEnd,type:prior.periodType as 'YTD',fiscalYear:2025,fiscalQuarter:2 as const,calendarReference:'exact-comparative-column'};
 const extract={...noProof,rows:[{...prior,comparativePeriod:{bodyHash:f.input.extract.bodyHash,period,sourcePageEvidenceHashes:['a'.repeat(64),'b'.repeat(64)],method:'TWO_INDEPENDENT_EXPLICIT_COMPARATIVE_COLUMN_READERS' as const,evidenceReference:'source-page-previous-period'}}]};
 const n=normalizeStatement({...f.input,extract,extractHash:hash(extract)});expect(n.observations).toHaveLength(1);expect(n.observations[0].fiscalYear).toBe(2025);expect(n.observations[0].periodEnd).toBe(prior.periodEnd);
 expect(()=>normalizeStatement({...f.input,extract:{...extract,rows:[{...extract.rows[0],comparativePeriod:{...extract.rows[0].comparativePeriod,bodyHash:'c'.repeat(64)}}]},extractHash:hash(extract)})).toThrow();
});
