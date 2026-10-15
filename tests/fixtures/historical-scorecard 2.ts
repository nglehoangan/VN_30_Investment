import type {PrismaClient} from '@/infrastructure/db/generated/client';
import type {Scorecard} from '@/domain/scoring/scorecard';
import {manifestDigest} from '@/infrastructure/fundamentals/snapshot-hash';
/** TEMP DB only: represents a pre-Slice06 upstream artifact for decision-owner regressions.
 * Never invents dataset bindings or asserts current scoring readiness. */
export async function seedHistoricalScorecard(client:PrismaClient,card:Scorecard){
 const body=JSON.stringify(card);await client.analyticalArtifact.create({data:{id:card.id,kind:'SCORECARD',methodologyId:card.methodology.methodologyId,asOf:card.asOf,calculatedAt:card.calculatedAt,body,bodyHash:manifestDigest(body)}});
}
/** Historical upstream ranking for downstream current/workflow/backup regression only. */
export async function seedHistoricalRanking(client:PrismaClient,ranking:import('@/domain/ranking/rank').Ranking){
 const body=JSON.stringify(ranking);await client.analyticalArtifact.create({data:{id:ranking.id,kind:'RANKING',methodologyId:ranking.input.cards[0].methodology.methodologyId,asOf:ranking.asOf,calculatedAt:ranking.calculatedAt,body,bodyHash:manifestDigest(body)}});
}
