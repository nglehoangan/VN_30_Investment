import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { brokerObservationSchema } from "@/infrastructure/config/nav-broker-observations";
import { exactJson } from "@/infrastructure/market-boundary/exact-json";
import { snapshotHash } from "@/infrastructure/fundamentals/snapshot-hash";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { decimal, shareQuantity } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import type { BrokerEvidenceReader, BrokerEvidencePinV1, BrokerEvidenceReadV1, BrokerObservationsV1 } from "@/ports/nav-read-adapters";

const check = (value: unknown, reason: string): void => { if (!value) throw new EvidenceReadError(reason); };
class EvidenceReadError extends Error { constructor(readonly reason: string) { super(reason); } }
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
/** Bounded immutable bytes only. No network, database, financial inference or authority verifier. */
export class ImmutableBrokerEvidenceReader implements BrokerEvidenceReader {
  private readonly root: string;
  constructor(root: string, private readonly maxBytes = 1_000_000) {
    check(path.isAbsolute(root), "BROKER_ROOT_MUST_BE_ABSOLUTE");
    check(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= 4_000_000, "BROKER_LIMIT_INVALID");
    this.root = path.resolve(root);
  }
  private async paths(relative: string) {
    check(relative.length > 0 && !path.isAbsolute(relative) && !relative.includes("\\") && relative.split("/").every(p => p !== ".." && p !== "." && p.length > 0), "BROKER_PATH_TRAVERSAL");
    check(await realpath(this.root) === this.root, "BROKER_SYMLINK_TRAVERSAL");
    const root = await lstat(this.root);
    check(root.isDirectory() && !root.isSymbolicLink(), "BROKER_ROOT_INVALID");
    const identities = [`${root.dev}:${root.ino}`];
    let current = this.root;
    const parts = relative.split("/");
    for (let i = 0; i < parts.length; i++) {
      current = path.join(current, parts[i]);
      const stat = await lstat(current);
      check(!stat.isSymbolicLink(), "BROKER_SYMLINK_TRAVERSAL");
      check(i === parts.length - 1 ? stat.isFile() : stat.isDirectory(), "BROKER_NOT_REGULAR_FILE");
      identities.push(`${stat.dev}:${stat.ino}`);
    }
    return { file: current, identities: identities.join("/") };
  }
  private async bytes(pin: BrokerEvidencePinV1) {
    check(/^[a-f0-9]{64}$/.test(pin.sha256), "BROKER_HASH_INVALID");
    check(Number.isSafeInteger(pin.size) && pin.size > 0 && pin.size <= this.maxBytes, "BROKER_SIZE_LIMIT");
    const beforePath = await this.paths(pin.path);
    const handle = await open(beforePath.file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const before = await handle.stat();
      check(before.isFile() && before.size <= this.maxBytes && before.size === pin.size, "BROKER_SIZE_MISMATCH");
      const buffer = Buffer.alloc(pin.size + 1);
      let length = 0;
      while (length < buffer.length) {
        const r = await handle.read(buffer, length, buffer.length - length, null);
        if (!r.bytesRead) break;
        length += r.bytesRead;
      }
      const after = await handle.stat(), afterPath = await this.paths(pin.path), named = await lstat(afterPath.file);
      check(length === pin.size && after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs && before.dev === after.dev && before.ino === after.ino && beforePath.identities === afterPath.identities && named.dev === before.dev && named.ino === before.ino, "BROKER_FILE_CHANGED");
      const bytes = buffer.subarray(0, length);
      check(sha(bytes) === pin.sha256, "BROKER_HASH_MISMATCH");
      return bytes;
    } finally { await handle.close(); }
  }
  async read(inputPin: BrokerEvidencePinV1, cutoff: { readonly valuationAt: string; readonly knowledgeCutoff: string; readonly calculatedAt: string }): Promise<BrokerEvidenceReadV1> {
    const pin = deepFreeze(JSON.parse(JSON.stringify(inputPin)) as BrokerEvidencePinV1);
    cutoff = deepFreeze({ ...cutoff });
    let observation: BrokerObservationsV1 | null = null;
    try {
      check(pin.schema === "nav-broker-observations-v1", "BROKER_SCHEMA_UNSUPPORTED");
      check([pin.id, pin.documentId, pin.provider, pin.accountId, pin.portfolioId, pin.perimeterId].every(s => typeof s === "string" && s.trim().length > 0 && s.length <= 512), "BROKER_SOURCE_IDENTITY_INVALID");
      const bytes = await this.bytes(pin);
      check(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) && !bytes.includes(0), "BROKER_ENCODING_UNSUPPORTED");
      let decoded: string;
      try { decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new EvidenceReadError("BROKER_ENCODING_UNSUPPORTED"); }
      let raw: unknown;
      try { raw = exactJson(decoded); } catch { throw new EvidenceReadError("BROKER_JSON_INVALID"); }
      const parsed = brokerObservationSchema.safeParse(raw);
      check(parsed.success, "BROKER_SCHEMA_UNSUPPORTED");
      if (!parsed.success) throw new EvidenceReadError("BROKER_SCHEMA_UNSUPPORTED");
      observation = parsed.data;
      for (const key of ["documentId", "provider", "accountId", "portfolioId", "perimeterId"] as const) check(observation[key] === pin[key], key === "accountId" ? "BROKER_ACCOUNT_MISMATCH" : "BROKER_SOURCE_IDENTITY_MISMATCH");
      const t = instant(cutoff.valuationAt), k = instant(cutoff.knowledgeCutoff), c = instant(cutoff.calculatedAt);
      const o = observation;
      [o.observedAt, o.retrievedAt, o.knownAt].forEach(instant);
      check(o.observedAt <= o.retrievedAt && o.retrievedAt <= o.knownAt && o.knownAt <= k && t <= k && k <= c, "BROKER_FUTURE_INFORMATION");
      check(o.observedAt === t, "BROKER_VALUATION_TIME_MISMATCH");
      if (o.publicationAt !== null) { instant(o.publicationAt); check(o.publicationAt <= o.retrievedAt, "BROKER_FUTURE_INFORMATION"); }
      const ids = new Set<string>(), keys = new Set<string>();
      for (const [index, f] of o.fields.entries()) {
        check(f.reference === o.documentId && f.pointer === `/fields/${index}/value`, "BROKER_PROVENANCE_MISMATCH");
        check(!ids.has(f.id), "BROKER_DUPLICATE_EVIDENCE_ID"); ids.add(f.id);
        const key = JSON.stringify([f.kind, f.securityId, f.field]);
        check(!keys.has(key), "BROKER_CONFLICTING_OBSERVATIONS"); keys.add(key);
        if (f.value !== null) decimal(f.value);
        const security = f.kind === "SECURITY" || f.kind === "CORPORATE_ACTION";
        check(security ? f.securityId !== null && f.unit === "SHARES" && f.lifecycle !== null : f.unit === "VND" && f.securityId === null && f.lifecycle === null, "BROKER_FIELD_SEMANTICS_UNSUPPORTED");
        if (security && f.value !== null) shareQuantity(f.value);
      }
      check(o.conflicts.length === 0, "BROKER_CONFLICTING_OBSERVATIONS");
      return deepFreeze({ status: "OBSERVED", pin, observation: o, contentHash: snapshotHash(o), accepted: false });
    } catch (error) {
      const reason = error instanceof EvidenceReadError ? error.reason : (error as NodeJS.ErrnoException)?.code === "ENOENT" ? "BROKER_FILE_MISSING" : "BROKER_EVIDENCE_INVALID";
      return deepFreeze({ status: "BLOCKED", pin, observation, reasons: [reason], conflicts: observation?.conflicts ?? [], accepted: false });
    }
  }
}
