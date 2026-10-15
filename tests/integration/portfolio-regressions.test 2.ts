// @vitest-environment node
import { beforeEach, afterEach, it, expect } from 'vitest';
import { testDatabase } from '../fixtures/database';
import { methodologyFixture } from '../fixtures/methodology';
import { PrismaPortfolioLedger, PrismaPortfolioSetup } from '@/infrastructure/repositories/portfolio-ledger';
import { initializePortfolio } from '@/application/portfolio/initialize';
import { PortfolioEngine } from '@/application/portfolio/engine';
import { ACCOUNTING_METHOD } from '@/domain/portfolio/values';
import { instant, dateOnly } from '@/shared/time';
import { P,A,NOW,at,method,deposit,buy,reversal,input } from '../fixtures/portfolio/history';
import type { TransactionInput } from '@/domain/portfolio/transaction';
let db: Awaited<ReturnType<typeof testDatabase>>, ledger: PrismaPortfolioLedger, engine: PortfolioEngine;
beforeEach(async()=>{
 db=await testDatabase(); await db.registry.append({...methodologyFixture(method),implementationIdentity:ACCOUNTING_METHOD});
 await initializePortfolio(new PrismaPortfolioSetup(db.client),{id:P,name:'audit',currency:'VND',inceptionAt:at(1),createdAt:NOW},[{id:A,name:'A'}]);
 ledger=new PrismaPortfolioLedger(db.client); engine=new PortfolioEngine(ledger,{now:()=>NOW});
});
afterEach(async()=>{await db?.close()});
const post=async(f:TransactionInput)=>engine.post([f],(await ledger.read(P)).watermark);
it('AUDIT-C01 must reject a second active split backdated before the first reversal',async()=>{
 await post(deposit());await post(buy());
 const corporateAction={id:'same-issuer-action',subtype:'SPLIT',numerator:'2',denominator:'1',evidence:'one official split',stage:'EFFECTIVE' as const};
 await post(input('split-original','CORPORATE_ACTION',3,{securityId:A,quantity:'100',corporateAction}));
 await post(reversal('reverse-split','split-original',5));
 const attempt=post(input('split-backdated','CORPORATE_ACTION',4,{securityId:A,quantity:'200',corporateAction}));
 await expect(attempt).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'DUPLICATE_CORPORATE_ACTION_STAGE'}]});
 expect((await ledger.read(P)).watermark).toBe('4');
 expect(await db.client.ledgerTransaction.count()).toBe(4);
 expect((await engine.reconstruct(P,NOW)).positions[0].quantity).toBe('100');
});
it('AUDIT-M01 snapshot must resolve January 3 reference at January 2 18:00 UTC (January 3 01:00 Vietnam)',async()=>{
 await post(deposit());await post(buy());const cutoff=instant('2026-01-02T18:00:00.000Z');
 const result=await engine.snapshot(P,cutoff,{version:'prices',methodologyId:'v1',observations:[{id:'price',securityId:A,price:'10',currency:'VND',observedAt:cutoff,receivedAt:cutoff,validThrough:cutoff,sourceReference:'fixture'}]},null,{version:'ref',intervals:[{id:'old',kind:'SECTOR',securityId:A,from:dateOnly('2026-01-01'),to:dateOnly('2026-01-03'),value:'OLD',taxonomy:'t',sourceReference:'ref'},{id:'new',kind:'SECTOR',securityId:A,from:dateOnly('2026-01-03'),to:null,value:'NEW',taxonomy:'t',sourceReference:'ref'}]},'t');
 expect(result.reference[0].sector).toBe('NEW');
});
it('AUDIT-M02 a snapshot before supported inception must not claim VALID zero-state history',async()=>{
 const cutoff=instant('2025-12-01T00:00:00.000Z');
 const attempt=engine.snapshot(P,cutoff,{version:'p',methodologyId:'v',observations:[]},{id:'r',portfolioId:P,asOf:cutoff,receivedAt:cutoff,sourceReference:'outside supported history',cash:'0',positions:[],receivables:'0',payables:'0',unresolvedDiscrepancy:false},{version:'r',intervals:[]},'t');
 await expect(attempt).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'BEFORE_SUPPORTED_INCEPTION'}]});
 await expect(engine.reconstruct(P,cutoff)).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'BEFORE_SUPPORTED_INCEPTION'}]});
 await expect(engine.reconstruct(P,cutoff,(await ledger.read(P)).watermark)).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'BEFORE_SUPPORTED_INCEPTION'}]});
});

it('C01 replacement after reversal preserves original historical state and accepts one active stage',async()=>{
 await post(deposit()); await post(buy());
 const corporateAction={id:'correctable-split',subtype:'SPLIT',numerator:'2',denominator:'1',evidence:'issuer',stage:'EFFECTIVE' as const};
 await post(input('split-first','CORPORATE_ACTION',3,{securityId:A,quantity:'100',corporateAction}));
 await post(reversal('split-reversal','split-first',5));
 await post(input('split-replacement','CORPORATE_ACTION',6,{securityId:A,quantity:'100',corporateAction}));
 expect((await engine.reconstruct(P,at(4))).positions[0]).toMatchObject({quantity:'200',openCost:'1000'});
 expect((await engine.reconstruct(P,at(5))).positions[0].quantity).toBe('100');
 expect((await engine.reconstruct(P,NOW)).positions[0]).toMatchObject({quantity:'200',openCost:'1000'});
 await expect(post(input('split-extra','CORPORATE_ACTION',7,{securityId:A,quantity:'200',corporateAction}))).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'DUPLICATE_CORPORATE_ACTION_STAGE'}]});
});
it('C01 replay rejects a duplicate backdated before the original even if latest active state appears free',async()=>{
 await post(deposit()); await post(buy());
 const corporateAction={id:'early-split',subtype:'SPLIT',numerator:'2',denominator:'1',evidence:'issuer',stage:'EFFECTIVE' as const};
 await post(input('split-original','CORPORATE_ACTION',4,{securityId:A,quantity:'100',corporateAction}));
 await post(reversal('reverse-split','split-original',6));
 await expect(post(input('split-earlier','CORPORATE_ACTION',3,{securityId:A,quantity:'100',corporateAction}))).rejects.toMatchObject({code:'VALIDATION_ERROR',issues:[{reason:'DUPLICATE_CORPORATE_ACTION_STAGE'}]});
 expect((await ledger.read(P)).watermark).toBe('4');
});
it('C01 atomic replacement at reversal effective time follows deterministic economic ordering',async()=>{
 await post(deposit()); await post(buy());
 const corporateAction={id:'atomic-split',subtype:'SPLIT',numerator:'2',denominator:'1',evidence:'issuer',stage:'EFFECTIVE' as const};
 await post(input('split-original','CORPORATE_ACTION',3,{securityId:A,quantity:'100',corporateAction}));
 const group={correctionGroupId:'split-correction'};
 await engine.post([reversal('01-reversal','split-original',5,group), input('02-replacement','CORPORATE_ACTION',5,{...group,securityId:A,quantity:'100',corporateAction})],(await ledger.read(P)).watermark);
 expect((await engine.reconstruct(P,NOW)).positions[0].quantity).toBe('200');
});

const inceptionPrices=()=>({version:'inception-prices-v1',methodologyId:'valuation-v1',observations:[{id:'opening-price',securityId:A,price:'20',currency:'VND' as const,observedAt:at(1),receivedAt:at(1),validThrough:at(1),sourceReference:'inception close'}]});
const inceptionReferences=()=>({version:'inception-reference-v1',intervals:[
 {id:'member',kind:'MEMBERSHIP' as const,securityId:A,from:dateOnly('2026-01-01'),to:null,value:'MEMBER',taxonomy:null,sourceReference:'index evidence'},
 {id:'sector',kind:'SECTOR' as const,securityId:A,from:dateOnly('2026-01-01'),to:null,value:'TECH',taxonomy:'t',sourceReference:'sector evidence'}]});
const inceptionInputs=()=>({prices:inceptionPrices(),references:inceptionReferences()});
const currentPrices=()=>({version:'current-prices-v1',methodologyId:'valuation-v1',observations:[{...inceptionPrices().observations[0],id:'current-price',price:'30',observedAt:at(3),receivedAt:at(3),validThrough:at(3)}]});
const statement=()=>({id:'statement',portfolioId:P,asOf:at(3),receivedAt:at(3),sourceReference:'broker',cash:'600',positions:[{securityId:A,quantity:'100',openCost:'1000'}],receivables:'0',payables:'0',unresolvedDiscrepancy:false});
async function imported(){
 await post(input('opening-cash','OPENING_BALANCE',1,{amount:'500',opening:{cost:'0',evidence:'broker opening cash',migrationVersion:'verified-import-v1'}}));
 await post(input('opening-shares','OPENING_BALANCE',1,{securityId:A,quantity:'100',opening:{cost:'1000',evidence:'broker verified shares',migrationVersion:'verified-import-v1'}}));
 // A deposit at the SAME inception instant must not be included twice in imported capital.
 await post(deposit('new-contribution','100',1));
}
it('M03 imported NAV baseline is priced, reproducible, versioned and separate from cost and contributions',async()=>{
 await imported();
 const snapshot=await engine.snapshot(P,at(3),currentPrices(),statement(),inceptionReferences(),'t',inceptionInputs());
 expect(snapshot).toMatchObject({status:'VALID',actionabilityBlocked:false,inception:{kind:'IMPORTED',status:'VALID',nav:'2500',asOf:at(1),ledgerWatermark:'3',priceVersion:'inception-prices-v1',referenceVersion:'inception-reference-v1',transactionIds:['opening-cash','opening-shares'],prices:[{id:'opening-price',sourceReference:'inception close'}]},valuation:{nav:'3600',supportedInceptionNav:'2500',economicPnl:'1000',economicPnlStatus:'VALID',unrealizedPnl:'2000'}});
 const reloaded=new PortfolioEngine(new PrismaPortfolioLedger(db.client),{now:()=>NOW});
 expect(await reloaded.snapshot(P,at(3),currentPrices(),statement(),inceptionReferences(),'t',inceptionInputs())).toEqual(snapshot);
 const versions={priceVersion:'current-prices-v1',referenceVersion:'inception-reference-v1',inceptionPriceVersion:'inception-prices-v1',inceptionReferenceVersion:'inception-reference-v1'};
 expect(await engine.isSnapshotCurrent(snapshot,versions)).toBe(true);
 expect(await engine.isSnapshotCurrent(snapshot,{...versions,inceptionPriceVersion:'revised'})).toBe(false);
 expect(await engine.isSnapshotCurrent(snapshot,{...versions,inceptionReferenceVersion:'revised'})).toBe(false);
 expect(await engine.isSnapshotCurrent(snapshot,{priceVersion:versions.priceVersion,referenceVersion:versions.referenceVersion})).toBe(false);
});
it('M03 absent inception inputs block actionable imported snapshot while preserving current NAV',async()=>{
 await imported();
 expect(await engine.snapshot(P,at(3),currentPrices(),statement(),inceptionReferences(),'t')).toMatchObject({status:'BLOCKED',actionabilityBlocked:true,inception:{status:'BLOCKED',nav:null,reason:'MISSING_INCEPTION_INPUTS'},valuation:{nav:'3600',economicPnl:null,economicPnlStatus:'BLOCKED'}});
});
it.each(['missing','stale','future','conflicting','missing-sector','missing-membership'] as const)('M03 %s inception evidence cannot be replaced with cost basis or current inputs',async(kind)=>{
 await imported();const inputs=inceptionInputs();
 if(kind==='missing') inputs.prices.observations=[];
 if(kind==='stale') inputs.prices.observations[0]={...inputs.prices.observations[0],observedAt:instant('2025-12-31T09:00:00.000Z'),validThrough:instant('2025-12-31T09:00:00.000Z')};
 if(kind==='future') inputs.prices.observations[0]={...inputs.prices.observations[0],observedAt:at(2),validThrough:at(2)};
 if(kind==='conflicting') inputs.prices.observations.push({...inputs.prices.observations[0],id:'conflict',price:'21'});
 if(kind==='missing-sector') inputs.references.intervals=inputs.references.intervals.filter(r=>r.kind!=='SECTOR');
 if(kind==='missing-membership') inputs.references.intervals=inputs.references.intervals.filter(r=>r.kind!=='MEMBERSHIP');
 expect(await engine.snapshot(P,at(3),currentPrices(),statement(),inceptionReferences(),'t',inputs)).toMatchObject({status:'BLOCKED',actionabilityBlocked:true,inception:{status:'BLOCKED',nav:null},valuation:{nav:'3600',economicPnl:null}});
});
it('M03 revised inception evidence recomputes gain without changing ledger',async()=>{
 await imported();const before=await ledger.read(P),inputs=inceptionInputs();
 inputs.prices.version='inception-prices-v2';inputs.prices.observations[0].price='25';
 const result=await engine.snapshot(P,at(3),currentPrices(),statement(),inceptionReferences(),'t',inputs);
 expect(result).toMatchObject({inception:{nav:'3000',priceVersion:'inception-prices-v2'},valuation:{nav:'3600',economicPnl:'500'}});
 expect(await ledger.read(P)).toEqual(before);
});
it('M02 inception itself is supported and empty zero-start history is distinct from pre-inception',async()=>{
 expect(await engine.reconstruct(P,at(1))).toMatchObject({supportedInceptionAt:at(1),supportedInception:'ZERO',cash:'0'});
});
it.each([
 ['2026-01-02T16:59:59.999Z','OLD'],
 ['2026-01-02T17:00:00.000Z','NEW'],
 ['2026-01-02T23:59:59.999Z','NEW'],
 ['2026-01-03T00:00:00.000Z','NEW'],
])('M01 reference day boundary %s resolves sector and identifier to %s',async(timestamp,expected)=>{
 await post(deposit());await post(buy());const cutoff=instant(timestamp);
 const intervals=(['SECTOR','IDENTIFIER'] as const).flatMap(kind=>[
 {id:`old-${kind}`,kind,securityId:A,from:dateOnly('2026-01-01'),to:dateOnly('2026-01-03'),value:'OLD',taxonomy:kind==='SECTOR'?'t':null,sourceReference:'ref'},
 {id:`new-${kind}`,kind,securityId:A,from:dateOnly('2026-01-03'),to:null,value:'NEW',taxonomy:kind==='SECTOR'?'t':null,sourceReference:'ref'}]);
 const result=await engine.snapshot(P,cutoff,{version:'p',methodologyId:'v',observations:[]},null,{version:'ref',intervals},'t');
 expect(result.reference[0]).toMatchObject({sector:expected,identifier:expected});
});
