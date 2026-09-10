import { NotFoundError } from "@/shared/errors";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { MethodologyId } from "@/shared/ids";
/** No inference of approval and no fallback to a different/current version. */
export function findMethodology(registry: MethodologyRegistry, id: MethodologyId) {
  return registry.findById(id);
}

export async function requireMethodology(registry: MethodologyRegistry, id: MethodologyId) {
  const record = await findMethodology(registry, id);
  if (!record) throw new NotFoundError();
  return record;
}
