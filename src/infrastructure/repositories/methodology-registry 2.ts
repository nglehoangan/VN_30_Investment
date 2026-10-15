import type { PrismaClient } from "@/infrastructure/db/generated/client";
import type { MethodologyRegistry, MethodologyRegistryWriter } from "@/ports/methodology-registry";
import type { MethodologyId } from "@/shared/ids";
import type { MethodologyRecord } from "@/domain/methodology/record";
import { ConflictError, DataIntegrityError } from "@/shared/errors";
import { validateMethodology } from "./methodology-schema";
type Storage = Pick<PrismaClient, "methodologyRecord">;
/** Prisma shapes end here. No update/delete/upsert or public CRUD endpoint. */
export class PrismaMethodologyRegistry implements MethodologyRegistry, MethodologyRegistryWriter {
  constructor(private readonly storage: Storage) {}
  async findById(id: MethodologyId): Promise<Readonly<MethodologyRecord> | null> {
    try {
      const row = await this.storage.methodologyRecord.findUnique({ where: { methodologyId: id } });
      return row ? validateMethodology(row) : null;
    } catch { throw new DataIntegrityError(); }
  }
  async append(record: MethodologyRecord): Promise<void> {
    const data = validateMethodology(record);
    try { await this.storage.methodologyRecord.create({ data }); }
    catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new ConflictError();
      throw new DataIntegrityError();
    }
  }
}
