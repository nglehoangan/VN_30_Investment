import type { MethodologyRecord } from "@/domain/methodology/record";
import type { MethodologyId } from "@/shared/ids";
/** Read capability, separate from append-only persistence authority. */
export interface MethodologyRegistry {
  findById(id: MethodologyId): Promise<Readonly<MethodologyRecord> | null>;
}

export interface MethodologyRegistryWriter {
  append(record: MethodologyRecord): Promise<void>;
}
