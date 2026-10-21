import { RUBRICS } from '@/domain/scoring/methodology';
import type { SnapshotInputs, FundamentalSnapshot } from './snapshot';
import { requireFundamental } from './validation';
import { deepFreeze } from '@/domain/portfolio/transaction';

export const QUALITATIVE_RUBRICS = ['BQ-MOAT','BQ-RES','GQ-FWD','IC-IND','IC-POS','IC-CYCLE','RG-GOV','RG-UNC'] as const;
/** Evidence organizer only. Canonical topic mappings never authorize points or AI opinions. */
export function buildIssuerDossier(securityId: string, state: 'SCORABLE' | 'DEFERRED', s: FundamentalSnapshot, sources: SnapshotInputs, hash: (v: unknown) => string) {
  requireFundamental(state === 'SCORABLE', 'DEFERRED_DOSSIER_FORBIDDEN');
  requireFundamental(s.request.references.find(r => r.kind === 'UNIVERSE')?.content.includes(securityId), 'DOSSIER_UNIVERSE');
  const observations = sources.observations.filter(o => o.securityId === securityId && s.members.some(m => m.observationId === o.id && m.observationHash === hash(o)));
  const body = { contract:'issuer-evidence-dossier-v1', securityId, asOf:s.request.decisionAsOf, knownAt:s.request.systemKnownAt, snapshotHash:s.contentHash,
    status:'MACHINE_PREPARED_EVIDENCE_ONLY', narrativeStatus:'NO_AI_NARRATIVE', readyForScoring:false,
    rubrics:RUBRICS.map(r => ({ rubricId:r.id, classification:r.id === 'RG-RISK' ? 'H4' : (QUALITATIVE_RUBRICS as readonly string[]).includes(r.id) ? 'H1' : 'H2',
      formalAssessment:null, topics:r.topics.map(topic => {
        const facts=observations.filter(o => sources.registry.manifest.items.find(i => i.itemId === o.itemId)?.evidenceTopicMappings.some(m => m.rubricId === r.id && m.topic === topic));
        return { topic, facts:facts.map(o => ({observationId:o.id,observationHash:hash(o),value:o.normalized.value,unit:o.normalized.unit,currency:o.normalized.currency,periodStart:o.periodStart,periodEnd:o.periodEnd,rawCaptureId:o.rawCaptureId,sourcePointer:o.raw.fieldLocator})),
          derivations:sources.derived.filter(d => s.derivedIds.includes(d.id) && d.request.securityId === securityId && d.observations.some(o => facts.some(f => f.id === o.id))).map(d => ({id:d.id,hash:hash(d)})),
          conflicts:s.blockers, counterevidence:[], unresolvedQuestions:facts.length ? ['Human must evaluate relevance, counterevidence and rubric outcome'] : ['MISSING_REQUIRED_INPUT: verified rubric evidence'],
        };
      }),
    })),
  };
  return deepFreeze({...body,contentHash:hash(body)});
}
