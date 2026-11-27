import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const policyPath = 'docs/fundamental-data-engine/fpt-capital-allocation/targeted-evidence-update-2026-11-27/TARGETED_EVIDENCE_AUTHORITY.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFileSync(resolve(root, path));
const ref = path => ({ path, sha256: sha(read(path)) });
const hash = value => sha(JSON.stringify(value));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function check(ok, reason) { if (!ok) throw Error(reason); }
function pinned(pin) {
  const real = realpathSync(resolve(root, pin.path));
  check(real.startsWith(root + sep), 'VALUATION_PIN_ESCAPE');
  const bytes = readFileSync(real);
  check(sha(bytes) === pin.sha256, 'VALUATION_PIN_MISMATCH');
  return bytes;
}
const document = pin => JSON.parse(pinned(pin));
check(same(process.argv.slice(2), ['--ticker', 'FPT']), 'FPT_RESEARCH_ONLY');
const policy = document(ref(policyPath));
const accepted = document(policy.predecessor);
const owner = pinned(policy.owner).toString();
const vitestRequire = createRequire(realpathSync(resolve(root, 'node_modules/vitest/package.json')));
const viteRequire = createRequire(vitestRequire.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(viteRequire.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const engine='src/domain/current-scoring/capital-allocation-targeted-evidence.ts';
const {managementAllocation,reverseAnnualBenefit,evaluateOperatingLink,issueSensitivity}=await load(engine);
const {selectCafefRawCloseValue}=await load('src/domain/market-boundary/cafef-raw-close.ts');
const { gunzipSync }=await import('node:zlib');
const prior=document(accepted.result);
const priorWorkflow=document(accepted.workflow);
const inventory=document(policy.inventory);
const observations=document(policy.observations);
const review=document(policy.review);
const targets=['CA-REINV','CA-DIL'];
check(policy.status==='AUTHORIZED_TARGETED_RESEARCH' && owner.includes('owner authorizes a targeted evidence update') &&
  !policy.productionScoringAuthorized && !policy.publicationAuthorized && prior.ticker==='FPT' &&
  prior.cutoff==='2026-11-13' && accepted.executionId===priorWorkflow.executionId &&
  accepted.queueId===priorWorkflow.queueId && prior.aggregation.assessedPoints===45 && prior.aggregation.ratedWeight===97 &&
  same(prior.aggregation.genuineNrInScope,targets) && same(prior.aggregation,priorWorkflow.evidence.find(r=>r.stage==='SCORING').result.aggregation),
  'TARGETED_FPT_AUTHORITY');
for (const item of Object.values(inventory)) {
  const bytes=pinned(item);
  const raw=item.path.endsWith('.gz')?gunzipSync(bytes):bytes;
  check(sha(raw)===item.rawSha256,'RAW_SOURCE_BYTES_CHANGED');
}
const sourceData=document(inventory.TE13);
const receipt=sourceData.requests[0];
const rawRows=JSON.parse(receipt.rawResponse).Data.Data;
check(sha(receipt.rawResponse)===receipt.sha256 && sourceData.symbol==='FPT' && sourceData.exchange==='HOSE' &&
  receipt.httpStatus===200 && rawRows.length===sourceData.prices.length,'CAFEF_RECEIPT_INVALID');
const prices=sourceData.prices.map(row=>{
  check(rawRows.some(raw=>same(raw,row.raw)),'RAW_ROW_MISMATCH');
  const implied=row.raw.GiaTriKhopLenh*1e9/row.raw.KhoiLuongKhopLenh;
  check(implied>row.raw.GiaThapNhat*1000-20 && implied<row.raw.GiaCaoNhat*1000+20,'CAFEF_UNIT_CROSSCHECK');
  const knownAt=new Date(receipt.receivedAt).toISOString();
  return {date:row.date,price:Number(selectCafefRawCloseValue(row.raw,{
    ticker:'FPT',tradingDate:row.date,sourceUnit:'THOUSAND_VND_PER_SHARE',
    unitEvidence:{id:'TE13_MATCHED_TRADE_AMOUNT_AND_VOLUME',hash:receipt.sha256,knownAt,effectiveAt:knownAt}
  })),impliedTradeAverage:implied,rawPointer:'/Data/Data/'+rawRows.findIndex(raw=>same(raw,row.raw))+'/GiaDongCua'};
});
const issue=observations.issue;
const shares=issue.employee.shares+issue.managers.shares;
check(issue.before+shares===issue.after && shares*issue.issuePrice===issue.actualGrossLine31 &&
  issue.employee.gross+issue.managers.gross===issue.actualGrossLine31,'ESOP_SHARE_OR_RECEIPT_RECONCILIATION');
const quote=prices.find(row=>row.date===issue.completion).price;
const noticeQuote=prices.find(row=>row.date==='2026-06-12').price;
const windowLow=Math.min(...prices.map(row=>row.price));
const windowHigh=Math.max(...prices.map(row=>row.price));
const kpi=managementAllocation(issue.kpi.growth,issue.kpi.tsr,issue.before);
const completion=issueSensitivity(issue.before,shares,quote,issue.actualGrossLine31,0,0);
const issueCases=[issue.employee,issue.managers].map((cohort,i)=>{
  const value=issueSensitivity(issue.before,cohort.shares,quote,cohort.gross,0,0);
  return {cohort:i?'management':'employee',...value,
    reverse:[1,3,...(i?[5]:[])].map(years=>({years,discount:.12,annual:reverseAnnualBenefit(value.breakEvenBenefit,years,.12)}))};
});
const cost=observations.humanCapital.employeeCostVnd;
const employeeCount=observations.humanCapital.yearEndEmployees;
const human={...observations.humanCapital,revenue:70113000000000,operatingEbit:prior.products.annual.directEbit[1],
  parentNpat:9376127629501,
  revenuePerYearEndEmployee:70113000000000/employeeCount,employeeCostPerYearEndEmployee:cost/employeeCount,
  ebitPerYearEndEmployee:prior.products.annual.directEbit[1]/employeeCount,
  parentNpatPerConsolidatedYearEndEmployee:9376127629501/employeeCount,
  employeeExpenseToRevenue:cost/70113000000000,moocHoursPerYearEndEmployeeLower:3000000/employeeCount};
const products={};
const capital={...prior.capital};
for(const period of ['annual','current']) {
  const freeze=document(policy.periods[period]);
  pinned(freeze.retained);pinned(freeze.newObservations);
  check(same(freeze.evidenceIds,Object.keys(inventory).filter(id=>inventory[id].availableBy<=freeze.informationCutoff)) &&
    freeze.informationCutoff===(period==='annual'?'2026-04-08':'2026-11-13') && review.revisionCount<=1 &&
    Object.keys(review.periods[period]).every(id=>targets.includes(id)),'TARGETED_FREEZE_OR_REVIEW_INVALID');
  const operating=observations.operatingRegister.map(row=>({...row,
    eligibleRefs:row.refs.filter(id=>freeze.evidenceIds.includes(id)),
    assessment:period==='annual'&&row.id==='ALC'?'Retained FPT consolidated CWIP; FOX report availability falls after the annual research window. No realized service or linkage.':row.assessment,
    linkQualified:evaluateOperatingLink(row)}));
  check(operating.every(row=>!row.linkQualified),'REVIEW_NEW_QUALIFIED_LINK');
  const scopedReview=review.periods[period];
  capital[period]=prior.capital[period].map(row=>{
    if (!targets.includes(row.id)) return row;
    const update=scopedReview[row.id];
    check(row.points===null && update.proposedPoints===null && update.finalDisposition==='REJECTED' &&
      update.blockers.includes('RB05') && update.sourceRefs.every(id=>freeze.evidenceIds.includes(id)) &&
      Object.keys(update.findings).length===6,'TARGETED_BAND_OR_REVIEW_MISMATCH');
    return {...row,targetedReview:period==='annual'&&row.id==='CA-DIL'?{...update,findings:{
      RV01:'FY2022–25 retained issue inventory and ESOP operands were reconciled.',
      RV02:'FY2025 workforce context does not specify historical event terms or direct offsets.',
      RV03:'Incremental benefits lack an attributable range.',RV04:'Gross receipts differ from net proceeds.',
      RV05:'Retained historical period screens remain unqualified around actual issue dates.',
      RV06:'Earlier repeated issuance presents real transfer risk; either binary band remains unsupported.'
    }}:update};
  });
  products[period]={pins:{freeze:policy.periods[period],initial:policy.observations,initialReview:policy.review,finalReview:policy.review},
    operating,financialContext:{cumulative:prior.products.annual.cumulative,changes:prior.products.annual.annualChange,
      internationalIT:observations.intlIT,group9M:period==='current'?prior.products.current.group9M:null},
    humanCapital:human,retainedIssueHistory:prior.products.annual.issuance,
    wp5CommonMultiple:prior.products[period].wp5CommonMultiple,
    esop:period==='annual'?null:{issue,kpi:{...kpi,reported:issue.managers.shares,
      residualShares:issue.managers.shares-kpi.nominalShares},prices,quote,noticeQuote,
      marketRange:[windowLow,windowHigh],completion,issueCases,
      sensitivities:{
        adverse:issueSensitivity(issue.before,shares,windowHigh,issue.actualGrossLine31,0,0),
        completionReference:completion,
        favorableThresholdOnly:issueSensitivity(issue.before,shares,windowLow,issue.actualGrossLine31,0,
          shares*windowLow-issue.actualGrossLine31),
        illustrativeFeeSensitivity:issueSensitivity(issue.before,shares,quote,issue.actualGrossLine31,1e9,0)},
      reverse:[1,3,5].map(years=>({years,discount:.12,requiredAnnual:reverseAnnualBenefit(completion.breakEvenBenefit,years,.12)})),
      transferToStaffExpense:completion.breakEvenBenefit/cost,
      netProceeds:null,incrementalBenefit:null,
      economicConclusion:'Event raw close is a market sensitivity; post-announcement timing and unresolved offsets prevent a binary economic band.'}};
}
const aggregation={...prior.aggregation,effectiveScores:prior.aggregation.effectiveScores.map(row=>{
  if (!targets.includes(row.id)) return row;
  return {...row,targetedReview:capital.current.find(item=>item.id===row.id).targetedReview,remainingDependency:observations.pending[row.id]};
})};
check(same(aggregation.effectiveScores.filter(row=>!targets.includes(row.id)),
  prior.aggregation.effectiveScores.filter(row=>!targets.includes(row.id))), 'PREDECESSOR_EFFECTIVE_SCORE_CHANGED');
const scorecard=prior.scorecard.map(row=>targets.includes(row.id)?{...row,nrReason:observations.pending[row.id]}:row);
const result={...prior,prior:accepted.result,methodology:ref(policyPath),implementation:'fpt-ca-targeted-evidence-2026-11-27',
  executables:[engine,'tools/scoring/validate_fpt_targeted_capital_evidence.mjs'].map(ref),aggregation,
  researchRanking:prior.researchRanking.map(row=>({...row,effectiveScores:aggregation.effectiveScores})),
  investmentDecisionInput:{...prior.investmentDecisionInput,effectiveScores:aggregation.effectiveScores},
  scorecard,capital,products,targetedEvidence:{inventory:policy.inventory,qualification:policy.observations,audit:policy.audit,review:policy.review}};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
