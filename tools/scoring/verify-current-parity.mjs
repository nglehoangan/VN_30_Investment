/** Verify that the versioned limited-scoring residual-risk exception is the only calculator delta. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const predecessor = JSON.parse(readFileSync(resolve(root,
  'docs/fundamental-data-engine/acb-scoring-readiness/2026-11-19/assessment/ACB_EXECUTABLE_RECOVERY_APPROVED.json')));
const source = 'src/domain/current-scoring/scorecard.ts';
const review = 'src/domain/current-scoring/provenance.ts';
const resetRisk = (text) => text
  .replace('import {ACB_LIMITED_METHOD,FPT_LIMITED_METHOD} from "./limited-coverage";\n', '')
  .replace('type ExternalGate, ', '')
  .replace('ResidualRiskAssessment | ExternalGate<"NOT_RATED">', 'ResidualRiskAssessment')
  .replace('  const unresolvedResidualRisk = [ACB_LIMITED_METHOD,FPT_LIMITED_METHOD].includes(input.methodology.methodologyId) && input.residualRisk.status === "NOT_RATED";\n', '')
  .replace('(unresolvedResidualRisk || [', '[')
  .replace('.includes(input.residualRisk.status)),"INVALID_RISK")', '.includes(input.residualRisk.status),"INVALID_RISK")');
const resetReview = (text) => text
  .replace('import type { ExternalGate } from "@/domain/scoring/eligibility";\n', '')
  .replace(' | "residualRisk"', '')
  .replace('  readonly residualRisk: LegacyScoreInput["residualRisk"] | ExternalGate<"NOT_RATED">;\n', '');

for (const [path, reset] of [[source, resetRisk], [review, resetReview]]) {
  const bytes = reset(readFileSync(resolve(root, path), 'utf8'));
  if (createHash('sha256').update(bytes).digest('hex') !== predecessor.code.find(pin => pin.path === path)?.sha256) {
    throw Error('CURRENT_SCORING_PREDECESSOR_PARITY_MISMATCH');
  }
}
console.log(JSON.stringify({status: 'CURRENT_PARITY_PASS', predecessor: predecessor.runtimeProfile}));
