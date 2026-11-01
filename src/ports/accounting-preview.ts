import type { Wp1Evidence } from "@/domain/portfolio/accounting-event-preview";
/** Returns verified observations only; never an intake/source authority grant. */
export interface Wp1EvidenceReader { read(): Promise<Wp1Evidence> }
