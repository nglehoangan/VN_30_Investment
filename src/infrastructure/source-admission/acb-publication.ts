import 'server-only';
import type { PrismaClient } from '@/infrastructure/db/generated/client';
import type { CurrentPublicationSubject, CurrentReleaseGate } from '@/ports/current-publication';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';
import { assertNotRevoked } from '@/infrastructure/repositories/unified-admission';
import { createCurrentDatasetConsumer } from '../../../tools/scoring/acb-bank-adapter';
import { PrismaMethodologyRegistry } from '@/infrastructure/repositories/methodology-registry';
import { CurrentPurposeScoring, PinnedCurrentAssessmentAdoption } from './current-scoring';
import { PinnedCurrentExecutableAuthority } from './current-scoring-authority';
import { CurrentScorePublications } from './current-publication';
import { sourceBytes } from './registry';

export const ACB_PUBLICATION_ID = 'acb-official-limited-v4-20261030-60771d30b8aa';
const authority = {
  path: 'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-22-v4/V4_PUBLICATION_AUTHORITY.json',
  sha256: '4f084addc19db44b107ae773c2859a27f3a842549759b65056110437669ebeeb',
};

export function acbPublications(db: PrismaClient, root: string) {
  const read = () => JSON.parse(sourceBytes(root, authority).toString());
  const registration = read();
  const { route, subject, scoringApprovalHash } = registration;
  if (subject.scorecardId !== ACB_PUBLICATION_ID || route.subject.ticker !== 'ACB' ||
      route.subject.cutoff !== '2026-10-30' || hash(route) !== scoringApprovalHash) {
    throw Error('ACB_PUBLICATION_AUTHORITY_MISMATCH');
  }
  const gate: CurrentReleaseGate = {
    authorityReference: registration.id,
    authorityHash: authority.sha256,
    async verify(operation, supplied) {
      const current = read();
      const exact: CurrentPublicationSubject = {
        scorecardId: supplied.scorecardId, scorecardHash: supplied.scorecardHash,
        datasetHash: supplied.datasetHash, methodologyHash: supplied.methodologyHash, reviewHash: supplied.reviewHash,
      };
      if (!['PUBLISH', 'READ'].includes(operation) || hash(exact) !== hash(current.subject) ||
          !sourceBytes(root, current.ownerSource).toString().startsWith('Công bố V4 lên website')) {
        throw Error('ACB_EXACT_PUBLICATION_AUTHORITY_REQUIRED');
      }
      for (const key of [current.id, authority.sha256, route.executable.sha256, `vn30-score-approval:${scoringApprovalHash}`]) {
        await assertNotRevoked(db, key);
      }
    },
  };
  return new CurrentScorePublications(db, {
    async find(id) {
      if (id !== subject.scorecardId) throw Error('ACB_EXACT_PUBLICATION_SUBJECT_REQUIRED');
      const input = JSON.parse(sourceBytes(root, route.assessment).toString()).input;
      const consumer = await createCurrentDatasetConsumer(db, root, route.subject);
      const adoption = new PinnedCurrentAssessmentAdoption(root, route.assessment, route.reviewBindings);
      const executable = new PinnedCurrentExecutableAuthority(root, route.executable, { now: () => input.knownAt });
      return new CurrentPurposeScoring(db, new PrismaMethodologyRegistry(db), consumer, adoption, executable).find(id);
    },
  }, gate);
}
