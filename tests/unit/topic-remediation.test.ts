import { readFileSync,readdirSync } from 'node:fs';
import { describe,expect,it } from 'vitest';
import { verifyTopicRemediation,type TopicRemediation,type BindingDispositions } from '@/domain/personal-ai/topic-remediation';
import type { ReviewLineageGraph } from '@/domain/personal-ai/review-lineage';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
const base='docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/';
const graphs=readdirSync(base+'vn30-lineage-v1/issuers').map(f=>JSON.parse(readFileSync(base+'vn30-lineage-v1/issuers/'+f,'utf8')) as ReviewLineageGraph);
const work=JSON.parse(readFileSync(base+'acceptance-remediation-v1/topic-review-worklist.json','utf8')) as TopicRemediation;
const retired=JSON.parse(readFileSync(base+'acceptance-remediation-v1/binding-dispositions.json','utf8')) as BindingDispositions;
describe('topic remediation read-only verification',()=>{
 it('reconciles all 690 rubric mappings and expired bindings without DI or scores',()=>{
  expect(verifyTopicRemediation(graphs,work,retired,snapshotHash)).toMatchObject({rubricCount:690,topicCount:2490,retainedUnratedRubrics:688,expiredBindingCount:1780,currentReadyRubrics:0,diAccepted:false});
 });
 it('rejects missing topics',()=>expect(()=>verifyTopicRemediation(graphs,{...work,topics:work.topics.slice(1)},retired,snapshotHash)).toThrow());
 it('rejects modified financial maxima',()=>expect(()=>verifyTopicRemediation(graphs,{...work,rubrics:work.rubrics.map((r,i)=>i?r:{...r,maxPoints:r.maxPoints+1})},retired,snapshotHash)).toThrow());
 it('rejects changed assessment history',()=>expect(()=>verifyTopicRemediation(graphs,{...work,rubrics:work.rubrics.map((r,i)=>i?r:{...r,retainedHistoricalPoints:'1'})},retired,snapshotHash)).toThrow());
 it('rejects declaring related context sufficient',()=>expect(()=>verifyTopicRemediation(graphs,{...work,topics:work.topics.map((t,i)=>i?t:{...t,readyForScoring:true})} as unknown as TopicRemediation,retired,snapshotHash)).toThrow());
 it('rejects automatic binding renewal',()=>expect(()=>verifyTopicRemediation(graphs,work,{...retired,bindings:retired.bindings.map((b,i)=>i?b:{...b,replacementBinding:'invented-renewal'})} as unknown as BindingDispositions,snapshotHash)).toThrow());
 it('rejects hiding stale dependency references',()=>{
  const target=work.topics.find(t=>t.expiredObservationBindings.length>0)!;
  expect(()=>verifyTopicRemediation(graphs,{...work,topics:work.topics.map(t=>t===target?{...t,expiredObservationBindings:[]}:t)},retired,snapshotHash)).toThrow();
 });
 it('rejects dropping expired bindings',()=>expect(()=>verifyTopicRemediation(graphs,work,{...retired,bindings:retired.bindings.slice(1),count:retired.count-1},snapshotHash)).toThrow());
});
