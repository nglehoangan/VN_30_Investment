import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {createHash} from 'node:crypto';
import {ManualFundamentalsView} from '@/ui/manual-fundamentals';
import {buildManualCurrentSnapshot,type ManualStatement} from '@/domain/fundamentals/manual-first';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
const at='2026-10-13T04:00:00.000Z',h='a'.repeat(64);
const qualified:ManualStatement={documentId:'qualified-test',SHA256:h,verifiedHash:h,ticker:'TEST',issuer:'Synthetic issuer',documentType:'FINANCIAL_STATEMENTS',reportingPeriod:{start:'2025-01-01',end:'2025-12-31'},fiscalYear:2025,fiscalQuarter:null,reportingScope:'CONSOLIDATED',currency:'VND',unitBasis:'CURRENCY',retainedPath:'synthetic.pdf',importedAt:at,reviewedAt:at,publishedAt:null,historicalAvailability:'UNKNOWN',reviewStatus:'QUALIFIED',reviewReference:'synthetic-review',cadence:'QUARTERLY',fiscalYearEndMonth:12};
const newer={...qualified,documentId:'unqualified-test',SHA256:'b'.repeat(64),verifiedHash:'b'.repeat(64),reportingPeriod:{start:'2026-01-01',end:'2026-06-30'},fiscalYear:2026,fiscalQuarter:2,reviewStatus:'REVIEW_REQUIRED' as const};
const snapshot=buildManualCurrentSnapshot({snapshotId:'synthetic-ui',analysisAt:at,statements:[qualified,newer],facts:[],universe:[{ticker:'TEST',sector:'BANK'}],referenceStatus:'UNRESOLVED'},v=>createHash('sha256').update(canonicalJson(v)).digest('hex'));
describe('manual evidence disclosure',()=>{
 it('shows the latest retained unqualified hash separately from the older qualified analysis period',()=>{render(<ManualFundamentalsView snapshot={snapshot} />);expect(screen.getByText('b'.repeat(64))).toBeVisible();expect(screen.getByText(/Qualified analysis: 2025-12-31/)).toBeVisible();expect(screen.getByText(/FINANCIAL_STATEMENTS \/ 2026-06-30/)).toBeVisible();expect(screen.getByText(/\/ REVIEW_REQUIRED/)).toBeVisible();});
 it('separates material gaps from optional metrics without creating an investment score',()=>{render(<ManualFundamentalsView snapshot={snapshot} />);expect(screen.getByRole('heading',{name:'Material missing or conflicting evidence'})).toBeInTheDocument();expect(screen.getByText(/Optional metrics \(N\/R\):/)).toHaveTextContent('CASA');expect(screen.getAllByText('INSUFFICIENT')).toHaveLength(2);for(const cell of screen.getAllByText('INSUFFICIENT'))expect(cell).toBeVisible();expect(screen.queryByText(/Total Investment Score/)).not.toBeInTheDocument();});
});
