import type { CurrentPublishedCard } from "@/ports/current-publication";
import { ACB_PUBLICATION_ID, acbPublications } from "@/infrastructure/source-admission/acb-publication";
import { withScoringReadDatabase } from "./scoring-market-data";

export function readAcbPublishedScore(): Promise<CurrentPublishedCard | null> {
  return withScoringReadDatabase((db, root) => acbPublications(db, root).find(ACB_PUBLICATION_ID));
}
