/** Research authorization provenance only; never formal source admission or activation. */
export interface AuthorizationRef { path: string; sha256: string; pointer?: string }
export interface DecisionScope { ticker: string; cutoff: string; proposal: AuthorizationRef }
export interface ProposedOwnerDecision extends DecisionScope {
  decision: 'PROPOSED' | 'EXPLICITLY_APPROVED';
  authorization: AuthorizationRef | null;
}
export interface OwnerAuthorization {
  sourceAuthor: 'OWNER' | 'ASSISTANT'; decision: 'APPROVE' | 'PROPOSE';
  ownerId: string; purpose: 'RETROSPECTIVE_RESEARCH';
  ticker: string; cutoff: string; proposalSha256: string; proposalPointer?: string;
  authorization: AuthorizationRef; superseded: boolean;
}
/** Trusted host must verify original owner-authored bytes, exact fact/proposal scope
 * and the supersession chain. Never construct this callback from submitted JSON.
 * The offline CLI does not install one and therefore cannot grant approval. */
export type OwnerAuthorizationVerifier = (reference: AuthorizationRef, scope: DecisionScope) => OwnerAuthorization | null;
const validRef = (r: AuthorizationRef | null | undefined): r is AuthorizationRef =>
  !!r && typeof r.path === 'string' && !!r.path.trim() && /^[a-f0-9]{64}$/.test(r.sha256);
export function assessOwnerDecision(scope: DecisionScope | null, decision?: ProposedOwnerDecision,
  verify?: OwnerAuthorizationVerifier) {
  const pending = (reason: string) => ({status: 'PENDING_EXPLICIT_OWNER_APPROVAL' as const,
    authorization: null, reason});
  if (!decision || decision.decision === 'PROPOSED') return pending('PROPOSAL_IS_NOT_AUTHORIZATION');
  if (decision.decision !== 'EXPLICITLY_APPROVED' || !validRef(decision.authorization)) return pending('ACTUAL_OWNER_AUTHORIZATION_REFERENCE_REQUIRED');
  if (!scope || !validRef(scope.proposal) || !validRef(decision.proposal) || decision.ticker !== scope.ticker || decision.cutoff !== scope.cutoff ||
      decision.proposal.sha256 !== scope.proposal.sha256 || decision.proposal.path !== scope.proposal.path || decision.proposal.pointer !== scope.proposal.pointer) return pending('OWNER_DECISION_SCOPE_MISMATCH');
  if (!verify) return pending('OWNER_REFERENCE_NOT_INDEPENDENTLY_VERIFIED');
  try {
    const proof = verify(decision.authorization, scope);
    if (!proof || proof.sourceAuthor !== 'OWNER' || proof.decision !== 'APPROVE' || proof.superseded ||
        !proof.ownerId.trim() || proof.purpose !== 'RETROSPECTIVE_RESEARCH' ||
        proof.ticker !== scope.ticker || proof.cutoff !== scope.cutoff || proof.proposalSha256 !== scope.proposal.sha256 || proof.proposalPointer !== scope.proposal.pointer ||
        proof.authorization.path !== decision.authorization.path || proof.authorization.sha256 !== decision.authorization.sha256 ||
        proof.authorization.pointer !== decision.authorization.pointer) return pending('OWNER_AUTHORIZATION_NOT_VALID_FOR_THIS_PROPOSAL');
    return {status: 'EXPLICIT_OWNER_APPROVAL_VERIFIED' as const, authorization: proof.authorization,
      reason: 'TRUSTED_OWNER_AUTHORIZATION_FOR_EXACT_RESEARCH_PROPOSAL'};
  } catch { return pending('OWNER_AUTHORIZATION_VERIFICATION_FAILED'); }
}
