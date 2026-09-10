import { randomUUID } from "node:crypto";
import type { Clock, IdGenerator } from "@/ports/runtime";
import { instant } from "@/shared/time";
export const systemClock: Clock = Object.freeze({ now: () => instant(new Date().toISOString()) });
export const uuidGenerator: IdGenerator = Object.freeze({ next: () => randomUUID() });
