import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildWp1CommandPackage, verifyWp1CommandPackage } from '@/domain/portfolio/accounting-command-package';
import type { AccountingEventPlan } from '@/domain/portfolio/accounting-event-preview';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
const retained = JSON.parse(readFileSync('docs/fundamental-data-engine/evidence/2026-11-01-m8-wp1/final-remediation/actual-case-preview.json','utf8')) as { plan: AccountingEventPlan };
const at = '2026-11-02T09:00:00.000Z';
describe('WP1 exact command review package', () => {
  it('binds actual four event effects and unknown dates without emitting posting commands', () => {
    const p = buildWp1CommandPackage(retained.plan, at, snapshotHash);
    expect(p.commands).toHaveLength(4); expect(p.postingCommands).toEqual([]);
    expect(p.commands.every(c => c.economicEffectiveAt === null && c.postingAuthorization === null)).toBe(true);
    expect(p.commands.find(c => c.eventId === 'WP1-MWG-RECEIPT')?.effect).toMatchObject({amount:'95000',remainingClaimAmount:'475000'});
    expect(p.commands.find(c => c.eventId === 'WP1-FPT-PARTITION')?.effect).toMatchObject({available:'200',pending:'20'});
    expect(verifyWp1CommandPackage(p,retained.plan,snapshotHash)).toMatchObject({verified:true,productionPostingAuthorized:false,navAuthorized:false});
  });
  it.each(['ledgerHash','evidenceHash','ledgerWatermark'] as const)('rejects stale %s against a fresh plan', field => {
    const p = buildWp1CommandPackage(retained.plan,at,snapshotHash);
    expect(() => verifyWp1CommandPackage(p,{...retained.plan,[field]:'changed'},snapshotHash)).toThrow();
  });
  it('rejects changed amounts even with caller recomputed package hash', () => {
    const p = buildWp1CommandPackage(retained.plan,at,snapshotHash);
    const commands = p.commands.map((c,i) => i === 1 ? {...c,effect:{...c.effect,amount:'95001'}} : c);
    const body = {...p,commands}; const forged = {...body,packageHash:snapshotHash(body)};
    expect(() => verifyWp1CommandPackage(forged,retained.plan,snapshotHash)).toThrow();
  });
  it('rejects a different well-formed source hash against the fresh server plan', () => {
    const p = buildWp1CommandPackage(retained.plan,at,snapshotHash);
    const altered = {...p,commands:p.commands.map((c,i)=>i?c:{...c,evidence:c.evidence.map(e=>({...e,sha256:'0'.repeat(64)}))})};
    expect(() => verifyWp1CommandPackage(altered,retained.plan,snapshotHash)).toThrow();
  });
  it('rejects an injected posting authorization or NAV grant', () => {
    const p = buildWp1CommandPackage(retained.plan,at,snapshotHash);
    expect(() => verifyWp1CommandPackage({...p,navAuthorized:true} as unknown as typeof p,retained.plan,snapshotHash)).toThrow();
    expect(() => verifyWp1CommandPackage({...p,commands:p.commands.map(c=>({...c,postingAuthorization:'owner-approved'}))} as unknown as typeof p,retained.plan,snapshotHash)).toThrow();
  });
  it('rejects duplicate event identities and economic keys', () => {
    expect(() => buildWp1CommandPackage({...retained.plan,events:[...retained.plan.events.slice(0,3),retained.plan.events[0]]},at,snapshotHash)).toThrow();
  });
  it('rejects unsupported effective instant or source identity in a preview plan', () => {
    const p = retained.plan;
    expect(() => buildWp1CommandPackage({...p,events:p.events.map((e,i)=>i?e:{...e,economicEffectiveAt:at})} as unknown as AccountingEventPlan,at,snapshotHash)).toThrow();
    expect(() => buildWp1CommandPackage({...p,events:p.events.map((e,i)=>i?e:{...e,evidence:[{...e.evidence[0],sha256:'bad'}]})},at,snapshotHash)).toThrow();
  });
});
