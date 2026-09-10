import "server-only";
import { systemClock, uuidGenerator } from "@/infrastructure/runtime";
/** Composition root: concrete IO remains here, never in UI or pure modules. */
export const runtime = Object.freeze({ clock: systemClock, ids: uuidGenerator });
