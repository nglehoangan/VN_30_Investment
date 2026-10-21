/** Read-only cycle gate. Uses existing qualification; never creates approvals or changes heads. */
import './lib/ts-runtime.mjs';
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { latestCompletedHoseSession } = await import('../src/domain/market-boundary/completed-session.ts');
const { HOSE_HOLIDAYS_2026 } = await import('../src/domain/market-boundary/hose-calendar.ts');
const { buildTcbsPipeline } = await import('../src/infrastructure/market-boundary/tcbs-pipeline.ts');
const arg = name => process.argv.find(a => a.startsWith('--' + name + '='))?.slice(name.length + 3);
const at = new Date().toISOString();
const calendar = {version:'hose-calendar-2026-v1',validFrom:'2026-01-01',validThrough:'2026-12-31',holidayDates:HOSE_HOLIDAYS_2026};
const target = latestCompletedHoseSession(at, calendar);
const boards = [];
for (const folder of readdirSync('data/market-source/tcbs')) {
  const path = 'data/market-source/tcbs/' + folder;
  if (!existsSync(path + '/manifest.json')) continue;
  const manifest = JSON.parse(readFileSync(path + '/manifest.json', 'utf8'));
  for (const request of manifest.requests.filter(r => r.apiId === '5.3')) {
    if (!request.rawPath || /[/\\]/.test(request.rawPath)) continue;
    const raw = JSON.parse(readFileSync(path + '/' + request.rawPath, 'utf8'));
    const date = typeof raw.tradingDate === 'string' ? raw.tradingDate.split('/').reverse().join('-') : null;
    boards.push({folder:path,tradingDate:date,retrievedAt:request.retrievedAt,
      eligible:request.httpStatus === 200 && date === target && request.startedAt >= target + 'T08:00:00.000Z' && request.retrievedAt >= request.startedAt && request.retrievedAt <= at});
  }
}
let qualification = {status:'BLOCKED', reason:'COMPLETED_SESSION_BOARD_EVIDENCE_MISSING'};
const board = arg('board'), capture = arg('capture');
if (board && !boards.some(b => b.folder === board && b.eligible)) qualification.reason = 'BOARD_NOT_CAPTURED_FOR_COMPLETED_TARGET_SESSION';
else if (board && capture) {
  try {
    const c = buildTcbsPipeline(process.cwd(), {captureFolder:capture,boardFolder:board,builtAt:at});
    if (c.market.body.acceptedTradingDate !== target) throw Error('TARGET_SESSION_MISMATCH');
    qualification = {status:'PASS_CANDIDATE',marketHash:c.market.contentHash,independentAcceptance:c.independentAcceptance,readyForScoring:false};
  } catch (error) { qualification = {status:'BLOCKED',reason:error.message}; }
} else if (boards.some(b => b.eligible)) qualification.reason = 'EXPLICIT_CAPTURE_AND_BOARD_REQUIRED';
let preflight;
try { preflight = JSON.parse(execFileSync(process.execPath, ['scripts/preflight-production-scoring.mjs'], {encoding:'utf8'})); }
catch (error) { if (!error.stdout) throw error; preflight = JSON.parse(error.stdout); }
const report = {version:'completed-session-scoring-check-v1',at,targetTradingDate:target,cutoff:'15:00 Asia/Ho_Chi_Minh',
  sourceCapture:capture ?? null,boards,qualification,preflight,status:'BLOCKED — PRODUCTION SCORING NOT EXECUTED',
  additionalRequiredGates:['INDEPENDENT_MARKET_ACCEPTANCE_AND_CAS','FORMAL_RUNTIME_DATASET_ACCEPTANCE','REVIEWED_HUMAN_AND_OWNER_INPUTS'],
  scoresCreated:0,rankingsCreated:0,transactionsCreated:0,ordersSubmitted:0};
if (arg('out')) { mkdirSync(arg('out'), {recursive:true}); writeFileSync(arg('out') + '/SESSION_SCORING_CHECK.json', JSON.stringify(report,null,2)+'\n', {flag:'wx'}); }
console.log(JSON.stringify(report,null,2));
process.exitCode = 2;
