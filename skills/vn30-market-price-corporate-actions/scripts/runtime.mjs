import { createRequire } from 'node:module';
import { realpathSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, sep, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const canonical = value => JSON.stringify(sort(value), null, 2) + '\n';
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k,sort(value[k])]));
  return value;
}
export function pointer(object, ref = '') {
  if (ref && !ref.startsWith('/')) throw Error('INVALID_JSON_POINTER');
  for (const token of ref ? ref.slice(1).split('/') : []) {
    const key=token.replaceAll('~1','/').replaceAll('~0','~');
    if (object === null || typeof object !== 'object' || !Object.hasOwn(object,key)) throw Error('MISSING_JSON_POINTER:'+ref);
    object=object[key];
  }
  return object;
}
function contained(path) {
  const full=realpathSync(resolve(root,path)),rel=relative(realpathSync(root),full);
  if (!rel || rel.startsWith('..'+sep) || rel==='..' || resolve(full)===root) throw Error('SOURCE_OUTSIDE_REPOSITORY');
  return full;
}
export function verifyRef(ref) {
  if (!ref || !/^[a-f0-9]{64}$/.test(ref.sha256)) throw Error('SOURCE_PIN_REQUIRED');
  const bytes=readFileSync(contained(ref.path));
  if (createHash('sha256').update(bytes).digest('hex')!==ref.sha256) throw Error('SOURCE_HASH_MISMATCH:'+ref.path);
  const value=ref.pointer!==undefined?pointer(JSON.parse(bytes.toString('utf8')),ref.pointer):null;
  if (Object.hasOwn(ref,'expected') && canonical(value)!==canonical(ref.expected)) throw Error('SOURCE_POINTER_VALUE_MISMATCH:'+ref.path);
  return value;
}
export function verifyInput(input) {
  function pins(value) {
    if (value && typeof value==='object') {
      if (typeof value.path==='string' && typeof value.sha256==='string') verifyRef(value);
      for (const child of Object.values(value)) pins(child);
    }
  }
  pins(input);
  const equalRef = (ref,expected) => {
    if (!ref || ref.pointer===undefined || !Object.hasOwn(ref,'expected') || canonical(verifyRef(ref))!==canonical(expected)) throw Error('EXACT_VALUE_BINDING_REQUIRED');
  };
  equalRef(input.price.rawEvidence,input.rawPrice);
  const receipt=verifyRef(input.price.receiptEvidence);
  if (receipt.receivedAt!==input.price.receivedAt || receipt.sourceUrl!==input.price.sourceUrl ||
      receipt.responseSha256!==input.price.sourceBodySha256 || canonical(receipt.raw)!==canonical(input.rawPrice)) throw Error('ORIGINAL_RECEIPT_BINDING');
  // Replay the existing collector's exact embedded response; no fetch/copy/staging.
  const collection=JSON.parse(readFileSync(contained(input.price.receiptEvidence.path),'utf8'));
  if ((collection.origin==='SYNTHETIC_TEST_NOT_LIVE_RESEARCH') !== (input.sourceMode==='SYNTHETIC_TEST')) throw Error('SOURCE_MODE_MISMATCH');
  const request=collection.requests.find(r=>r.sha256===input.price.sourceBodySha256);
  if (!request || createHash('sha256').update(request.rawResponse).digest('hex')!==request.sha256 ||
      request.receivedAt!==input.price.receivedAt || request.url!==input.price.sourceUrl ||
      request.parameters.Symbol!==input.ticker || request.parameters.ExchangeType!==input.exchange ||
      !JSON.parse(request.rawResponse).Data.Data.some(row=>canonical(row)===canonical(input.rawPrice))) throw Error('RAW_REQUEST_REPLAY_MISMATCH');
  if (input.price.unitEvidence && input.price.unitSource && input.price.unitEvidence.hash!==input.price.unitSource.sha256) throw Error('UNIT_SOURCE_PIN_MISMATCH');
  for (const a of input.actions) {
    equalRef(a.providerEvidence,a.providerValue);
    if (a.official) {
      equalRef(a.official.evidence,a.official.value);
      const d=verifyRef(a.official.definitionSource);
      let identity;
      if(a.official.definitionLayout==='RETAINED_REVIEW_V1') identity={id:String(d.eventId),ticker:d.symbol,kind:d.eventType,period:d.fiscalPeriodLabel,exDate:d.exRightsDate,recordDate:d.recordDate,effectiveDate:d.paymentOrEffectiveDate};
      else if(a.official.definitionLayout==='NORMALIZED_EVENT_V1') identity=Object.fromEntries(['id','ticker','kind','period','exDate','recordDate','effectiveDate'].map(k=>[k,d[k]]));
      else throw Error('UNKNOWN_DEFINITION_LAYOUT');
      if (canonical(identity)!==canonical(Object.fromEntries(Object.keys(identity).map(k=>[k,a.official[k]])))) throw Error('OFFICIAL_EVENT_DEFINITION_MISMATCH');
    }
  }
  equalRef(input.shares.anchorSource,input.shares.anchor);
  equalRef(input.shares.reviewSource,input.shares.review);
}
export function assessShares(anchor,cutoff,review) {
  const code="import sys,json;sys.path.insert(0,sys.argv[1]);from lib.share_count_carry_forward import assess_share_count;j=json.load(sys.stdin);print(json.dumps(assess_share_count(j['anchor'],j['cutoff'],j['review'])))";
  const run=spawnSync('python3',['-B','-c',code,resolve(root,'scripts')],{input:JSON.stringify({anchor,cutoff,review}),encoding:'utf8',maxBuffer:1_000_000});
  if (run.status!==0) throw Error('SHARE_RULE_EXECUTION_FAILED:'+run.stderr);
  return JSON.parse(run.stdout);
}
export async function loadReview() {
  // Resolve the already-installed TS loader via Vitest/Vite; no package install or server.
  const vr=createRequire(realpathSync(resolve(root,'node_modules/vitest/package.json')));
  const jr=createRequire(vr.resolve('vite/package.json'));
  const {createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
  const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src')},fsCache:false,moduleCache:false});
  return (await jiti.import(resolve(root,'skills/vn30-market-price-corporate-actions/scripts/review.ts'))).review;
}
export async function run(input) { verifyInput(input); return (await loadReview())(input,{assessShares}); }
function resolvedFuture(path) {
  let current=resolve(path);const suffix=[];
  while (!existsSync(current)) {suffix.unshift(basename(current));current=dirname(current);}
  return resolve(realpathSync(current),...suffix);
}
export async function cli(args) {
  if (args.length!==4 || args[0]!=='--input' || args[2]!=='--out') throw Error('Usage: node .../runtime.mjs --input <json> --out <evidence-root>');
  const input=JSON.parse(readFileSync(resolve(args[1]),'utf8'));
  const result=await run(input);
  const outputRoot=resolvedFuture(args[3]);
  if (outputRoot===resolve(root,'data') || outputRoot.startsWith(resolve(root,'data')+sep)) throw Error('PRODUCTION_DATA_OUTPUT_FORBIDDEN');
  const dir=resolve(outputRoot,result.ticker,result.economicDate);
  if (resolvedFuture(dir)!==dir || !dir.startsWith(outputRoot+sep)) throw Error('OUTPUT_SCOPE_ESCAPE');
  const outputs={'EVIDENCE.json':canonical(result),'ACCEPTANCE.json':canonical({ticker:result.ticker,cutoff:result.economicDate,...result.acceptance})};
  for (const [name,bytes] of Object.entries(outputs)) if (existsSync(resolve(dir,name)) && readFileSync(resolve(dir,name),'utf8')!==bytes) throw Error('OUTPUT_CONFLICT_USE_NEW_REVIEW_DIRECTORY');
  mkdirSync(dir,{recursive:true});
  for (const [name,bytes] of Object.entries(outputs)) if (!existsSync(resolve(dir,name))) writeFileSync(resolve(dir,name),bytes,{flag:'wx'});
  return dir;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).then(dir=>process.stdout.write(dir+'\n')).catch(error=>{process.stderr.write(String(error)+'\n');process.exitCode=1;});
}
