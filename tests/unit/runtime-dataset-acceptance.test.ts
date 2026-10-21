// @vitest-environment node
import {beforeAll,it,expect} from 'vitest';
import {runtimeDatasetFixture} from '../fixtures/runtime-dataset';
let f:Awaited<ReturnType<typeof runtimeDatasetFixture>>;
beforeAll(async()=>{f=await runtimeDatasetFixture();},30_000);
it('complete synthetic packet binds 667 explicit reviews, owner gates, dossiers and independent acceptance; creates no score',async()=>{
 const r=await f.service.prepare(f.packet);expect(r.evidence.reviewHashes).toHaveLength(667);expect(r.evidence.dossierHashes).toHaveLength(29);expect(f.writes()).toBe(0);
 f.identity.subject=f.packet.acceptance.reviewerReference;f.identity.roles=['INDEPENDENT_DATASET_REVIEWER'];
 const accepted=await f.service.accept(f.packet,r.contentHash);expect(accepted.readyForScoring).toBe(false);expect(f.writes()).toBe(1);
});
it('producer cannot self-accept and request free text cannot supply a reviewer capability',async()=>{
 f.identity.subject=f.packet.acceptance.producerReference;f.identity.roles=['INDEPENDENT_DATASET_REVIEWER'];
 await expect(f.service.accept(f.packet,f.hash('anything'))).rejects.toThrow();
 f.identity.subject=f.packet.acceptance.reviewerReference;f.identity.roles=[];await expect(f.service.accept(f.packet,f.hash('anything'))).rejects.toThrow();
});
it('missing independent acceptance, unapproved HUMAN or changed evidence prevents progression',async()=>{
 const pin=f.packet.reviews[0],record=f.rows.get(pin.reviewId)!;
 f.rows.set(pin.reviewId,{...record,status:'REVIEWED'});await expect(f.service.prepare(f.packet)).rejects.toThrow();f.rows.set(pin.reviewId,record);
 await expect(f.service.prepare({...f.packet,reviews:f.packet.reviews.slice(1)})).rejects.toThrow();
 await expect(f.service.prepare({...f.packet,marketHash:f.hash('changed-price')})).rejects.toThrow();
 await expect(f.service.prepare({...f.packet,dossierHashes:f.packet.dossierHashes.map(()=>f.hash('fake'))})).rejects.toThrow();
});
it('MBB-equivalent deferred member has no score input/bridge and cannot enter packet',async()=>{
 expect(f.packet.acceptance.tickers[29]).toMatchObject({input:null,bridge:null});
 const changed={...f.packet,acceptance:{...f.packet.acceptance,tickers:f.packet.acceptance.tickers.map((t,i)=>i===29?{...t,input:f.packet.acceptance.tickers[0].input,bridge:f.packet.acceptance.tickers[0].bridge}:t)}};
 await expect(f.service.prepare(changed)).rejects.toThrow();
});
it('acceptance requires exact independent evidence reference and fresh packet hash',async()=>{
 await expect(f.service.prepare({...f.packet,acceptance:{...f.packet.acceptance,reviewArtifactReference:'mutable-review-url'}})).rejects.toThrow();
 f.identity.subject=f.packet.acceptance.reviewerReference;f.identity.roles=['INDEPENDENT_DATASET_REVIEWER'];
 await expect(f.service.accept(f.packet,f.hash('stale-packet'))).rejects.toThrow();
});
