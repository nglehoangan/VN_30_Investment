import { open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { currentSourceSchema } from "@/shared/validation/current-source";
import type { CurrentSourceProvider } from "@/ports/current";
/** Configured normalized manual dataset. No browser path, vendor scraping or fallback. */
export class LocalCurrentSource implements CurrentSourceProvider {
  constructor(private readonly file: string | undefined) {}
  async load(portfolioId: string) {
    if (!this.file) return null;
    if (!isAbsolute(this.file)) throw new Error("ABSOLUTE_SOURCE_PATH_REQUIRED");
    const handle = await open(this.file, "r");
    try {
      const limit = 4_000_000, buffer = Buffer.alloc(limit + 1);
      let length = 0;
      while (length < buffer.length) {
        const read = await handle.read(buffer, length, buffer.length - length, null);
        if (!read.bytesRead) break;
        length += read.bytesRead;
      }
      if (length > limit) throw new Error("SOURCE_PAYLOAD_LIMIT");
      const data = currentSourceSchema.parse(JSON.parse(buffer.subarray(0, length).toString("utf8")));
      if (data.portfolioId !== portfolioId) throw new Error("SOURCE_PORTFOLIO_MISMATCH");
      return data;
    } finally { await handle.close(); }
  }
}
