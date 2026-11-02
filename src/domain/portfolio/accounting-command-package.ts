import { deepFreeze } from './transaction';
import { requireRule } from './values';
import { instant } from '@/shared/time';
import type { AccountingEventPlan, AccountingHash } from './accounting-event-preview';

/** Review instructions, deliberately not TransactionInput and never sent to a commit port. */
export function buildWp1CommandPackage(plan: AccountingEventPlan, preparedAt: string, hash: AccountingHash) {
  instant(preparedAt);
  requireRule(plan.version === 'wp1-accounting-preview-v1' && plan.productionApplication === 'BLOCKED' && plan.postingCommands.length === 0, 'WP1_PREVIEW_PLAN_REQUIRED');
  requireRule(plan.events.length === 4 && new Set(plan.events.map(e => e.id)).size === 4 && new Set(plan.events.map(e => e.economicKey)).size === 4, 'WP1_EXACT_UNIQUE_EVENT_SET_REQUIRED');
  requireRule(['WP1-TCB-PENDING','WP1-MWG-RECEIPT','WP1-CUSTODY-ACCRUAL','WP1-FPT-PARTITION'].every(id => plan.events.some(e => e.id === id)), 'WP1_EVENT_IDENTITIES_REQUIRED');
  const commands = plan.events.map(event => {
    requireRule(event.costBasisDelta === '0' && event.economicEffectiveAt === null && event.brokerActionId === null && event.evidence.length > 0 && event.blockers.length > 0, 'WP1_PREVIEW_CANNOT_SELF_ADMIT');
    for (const pin of event.evidence) {
      requireRule(!!pin.id && /^[a-f0-9]{64}$/.test(pin.sha256) && pin.pointer.startsWith('/'), 'WP1_COMMAND_SOURCE_BINDING_REQUIRED');
      for (const at of [pin.knownAt,pin.retrievedAt]) if (at !== null) requireRule(instant(at) <= preparedAt, 'WP1_COMMAND_FUTURE_EVIDENCE');
    }
    const body = { eventId: event.id, economicKey: event.economicKey, eventHash: hash(event), effect: event.effect,
      evidence: event.evidence, originalLedgerRelationship: event.ledgerRelationship,
      economicEffectiveDate: event.economicEffectiveDate, economicEffectiveAt: event.economicEffectiveAt,
      observedAsOfDate: event.observedAsOfDate, brokerActionId: event.brokerActionId,
      costBasisDelta: event.costBasisDelta, mode: 'REVIEW_INSTRUCTION_ONLY' as const,
      sourceAdmission: 'NOT_ADMITTED' as const, actionAdmission: 'NOT_ADMITTED' as const,
      timeAdmission: 'NOT_ADMITTED' as const, postingAuthorization: null,
      blockers: [...event.blockers,'SOURCE_ACTION_TIME_ADMISSION_REQUIRED','SEPARATE_EXACT_COMMAND_OWNER_AUTHORIZATION_REQUIRED'],
      authorizationRequired: event.requiredAuthorization };
    return { ...body, commandHash: hash(body) };
  });
  const body = { contract: 'wp1-command-review-package-v1' as const, preparedAt,
    portfolioId: plan.portfolioId, ledgerWatermark: plan.ledgerWatermark, ledgerHash: plan.ledgerHash,
    evidenceHash: plan.evidenceHash, planHash: hash(plan), commands,
    requiredProductionCutoff: null, postingCommands: [], productionApplication: 'BLOCKED' as const,
    navAuthorized: false as const, tradingAuthorized: false as const };
  return deepFreeze({ ...body, packageHash: hash(body) });
}
export type Wp1CommandPackage = ReturnType<typeof buildWp1CommandPackage>;

/** The expected plan must be supplied by the fresh read-only validation workflow, never by the request. */
export function verifyWp1CommandPackage(value: Wp1CommandPackage, freshPlan: AccountingEventPlan, hash: AccountingHash) {
  const expected = buildWp1CommandPackage(freshPlan, value.preparedAt, hash);
  requireRule(hash(value) === hash(expected), 'WP1_COMMAND_PACKAGE_OR_FRESH_REVISION_MISMATCH');
  return deepFreeze({ verified: true, packageHash: expected.packageHash, productionApplication: 'BLOCKED' as const,
    productionPostingAuthorized: false as const, postingCommands: [], navAuthorized: false as const, tradingAuthorized: false as const });
}
