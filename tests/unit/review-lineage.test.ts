// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateDIAcceptance } from '@/domain/personal-ai/scoring-readiness';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { lineageSemantic, validateReviewLineageGraph, type ReviewLineageGraph } from '@/domain/personal-ai/review-lineage';
const root='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-lineage-v1';
const snapshot=JSON.parse(readFileSync(root+'/acceptance-snapshot.json','utf8'));
const tickers: string[]=snapshot.members.map((m:{ticker:string})=>m.ticker);
function graph(ticker='GVR') { return JSON.parse(readFileSync(`${root}/issuers/${ticker}.json`,'utf8')); }
function seal(g:ReturnType<typeof graph>):ReviewLineageGraph {
  for(const n of g.nodes) { const {hash,...semantic}=n;void hash;n.hash=snapshotHash(semantic); }
  g.contentHash=snapshotHash(lineageSemantic(g));return g;
}
function validate(g:ReturnType<typeof graph>){return validateReviewLineageGraph(seal(g),snapshotHash);}
describe('full VN30 source-to-rubric lineage candidate',()=>{
  it.each(tickers)('replays actual retained %s graph without granting authority',(ticker)=>{
    const result=validateReviewLineageGraph(graph(ticker as string),snapshotHash);
    expect(result.technicalMappingAccepted).toBe(true);expect(result.personalAiAcceptanceEligible).toBe(false);
    expect(result.productionScoringAuthorized).toBe(false);expect(result.financialAcceptance).toBe('BLOCKED');
  });
  it('preserves 23 rubrics per ticker and N/R versus retained zero',()=>{
    expect(snapshot.counts.rubric).toBe(690);expect(snapshot.counts.retainedAssessedRubrics).toBe(2);
    expect(graph('ACB').nodes.find((n:{id:string})=>n.id==='rubric:RG-UNC').value).toBe('0');
    expect(graph('GVR').nodes.find((n:{id:string})=>n.id==='rubric:RG-UNC').value).toBeNull();
  });
  it('quarantines BSR printed subtotal and keeps both distinct later-known branches',()=>{
    const g=graph('BSR'),value=(id:string)=>g.nodes.find((n:{id:string})=>n.id===id).value;
    expect(value('normalized:reported-common')).toBe('5230686242758');
    expect(value('derived:bsr-arithmetic-alternative')).toBe('5209551050863');
    expect(value('derived:bsr-printed-minus-arithmetic')).toBe('21135191895');
    expect(value('derived:bsr-later-parent-fund-partial')).toBe('4837780950863');
    expect(g.nodes.find((n:{id:string})=>n.id==='normalized:economic:unresolved').value).toBeNull();
  });
  it('ties GVR EPS deduction to current interim equity distribution without inventing final fund',()=>{
    const g=graph(),a=g.nodes.find((n:{id:string})=>n.id==='normalized:conflict:eps-known-fund'),b=g.nodes.find((n:{id:string})=>n.id==='normalized:conflict:equity-current-interim-parent-fund');
    expect(a.value).toBe('317726455843');expect(b.value).toBe(a.value);
    expect(g.sourceConflicts).toContain('FINAL_FUND_COMPLETENESS_UNRESOLVED');
  });
  it('repairs page-zero locators from checked originals and keeps bridge expiry visible',()=>{
    const nodes=graph('HPG').nodes.filter((n:{details:Record<string,unknown>})=>n.details.invalidLegacyPageLocator);
    expect(nodes).toHaveLength(9);expect(nodes.every((n:{source:{physicalPage:number|null}})=>n.source.physicalPage!==null&&n.source.physicalPage>0)).toBe(true);
    expect(snapshot.counts.stalePriorFactBindings).toBeGreaterThan(0);
  });
  it('connects the checked 30-Oct close to price evidence without falling back to older native quotes',()=>{
    for(const ticker of tickers){
      const g=graph(ticker),price=g.nodes.find((n:{id:string})=>n.id==='normalized:dated-market-price');
      expect(price.periodEnd).toBe('2026-10-30');expect(price.details.currentQuote).toBe(false);
      expect(g.nodes.find((n:{id:string})=>n.id==='evidence:VAL-PRIMARY:price').inputs).toContain(price.id);
    }
    expect(graph('GVR').nodes.find((n:{id:string})=>n.id==='normalized:dated-market-price').value).toBe('31250');
  });
  it('propagates source conflict branches into the affected rubric topics',()=>{
    const bsr=graph('BSR'),gvr=graph('GVR');
    expect(bsr.nodes.find((n:{id:string})=>n.id==='evidence:VAL-PRIMARY:normalized_denominator').inputs).toContain('derived:bsr-arithmetic-alternative');
    expect(gvr.nodes.find((n:{id:string})=>n.id==='evidence:RG-GOV:disclosure').inputs).toContain('normalized:conflict:equity-current-interim-parent-fund');
  });
  it('blocks duplicate IDs after all hashes are recomputed',()=>{const g=graph();g.nodes.push(structuredClone(g.nodes[0]));expect(()=>validate(g)).toThrow();});
  it('blocks dangling and cyclic/forward dependencies after recomputing hashes',()=>{
    for(const input of ['missing-node','rubric:BQ-EQ']){const g=graph();g.nodes[1].inputs=[input];expect(()=>validate(g)).toThrow();}
  });
  it('blocks altered metric values even with valid new hashes',()=>{const g=graph();g.nodes.find((n:{operation:string})=>n.operation==='RATIO').value='123';expect(()=>validate(g)).toThrow();});
  it('blocks wrong multiplier even when the output agrees with it',()=>{
    const g=graph(),n=g.nodes.find((n:{operation:string;unit:string})=>n.operation==='NORMALIZE'&&n.unit==='CURRENCY');n.multiplier='2';n.value=String(BigInt(n.value)*2n);expect(()=>validate(g)).toThrow();
  });
  it('blocks wrong period and source knowledge in the future',()=>{
    for(const kind of ['period','knowledge']){const g=graph();if(kind==='period')g.nodes[0].periodEnd='2027-01-01';else g.nodes[0].details.knownAt='2027-01-01T00:00:00.000Z';expect(()=>validate(g)).toThrow();}
  });
  it('blocks a period mismatch on a derived ratio',()=>{const g=graph();g.nodes.find((n:{operation:string})=>n.operation==='RATIO').periodStart='2024-01-01';expect(()=>validate(g)).toThrow();});
  it('does not launder model assumptions into reported facts',()=>{
    const g=graph('FPT');g.nodes.find((n:{kind:string;classification:string})=>n.kind==='NORMALIZED'&&n.classification==='ASSUMPTION').classification='REPORTED';expect(()=>validate(g)).toThrow();
  });
  it('does not promote contextual topic evidence to scoring support',()=>{const g=graph();g.nodes.find((n:{kind:string})=>n.kind==='EVIDENCE').details.sufficientForScoring=true;expect(()=>validate(g)).toThrow();});
  it('blocks changed rubric topics, maxima, and point zero semantics',()=>{
    for(const key of ['topics','maxPoints','value']){const g=graph('ACB'),n=g.nodes.find((n:{id:string})=>n.id==='rubric:RG-UNC');if(key==='value')n.value=null;else n.details[key]=key==='topics'?['invented_topic']:100;expect(()=>validate(g)).toThrow();}
  });
  it('blocks current-share substitution for a historical weighted denominator',()=>{
    const g=graph(),n=g.nodes.find((n:{id:string})=>n.id==='derived:reported-weighted-eps');n.inputs[1]='normalized:shares-outstanding';expect(()=>validate(g)).toThrow();
  });
  it('cannot be submitted as an already accepted personal AI DI receipt',()=>{expect(()=>validateDIAcceptance(snapshot)).toThrow();});
  it('cannot become a financial acceptance or production permission by changing a flag',()=>{
    const g=graph();g.acceptance.productionScoringAuthorized=true;expect(()=>validate(g)).toThrow();
    const h=graph();h.compatibility.directAdmission=true;expect(()=>validate(h)).toThrow();
  });
});
