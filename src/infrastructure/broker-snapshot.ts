import { open } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseBrokerSnapshot } from "@/infrastructure/config/broker-snapshot";
import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";

async function readPrivateFile(file: string, limit: number) {
  const handle = await open(file, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit || (stat.mode & 0o077)) throw new Error("INVALID_PRIVATE_BROKER_FILE");
    const buffer = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const read = await handle.read(buffer, length, buffer.length - length, null);
      if (!read.bytesRead) break;
      length += read.bytesRead;
    }
    if (length > limit) throw new Error("BROKER_FILE_TOO_LARGE");
    return buffer.subarray(0, length);
  } finally { await handle.close(); }
}

/** Server-configured observation only. Never grants capital actionability. */
export async function loadBrokerSnapshot(file: string | undefined): Promise<BrokerSnapshot | null> {
  if (!file) return null;
  if (!path.isAbsolute(file)) throw new Error("ABSOLUTE_BROKER_PATH_REQUIRED");
  const snapshot = parseBrokerSnapshot(JSON.parse((await readPrivateFile(file, 1_000_000)).toString("utf8")));
  for (const source of snapshot.sources) {
    const bytes = await readPrivateFile(path.join(path.dirname(file), source.file), 20_000_000);
    if (createHash("sha256").update(bytes).digest("hex") !== source.sha256) throw new Error("BROKER_SOURCE_HASH_MISMATCH");
  }
  return snapshot;
}
