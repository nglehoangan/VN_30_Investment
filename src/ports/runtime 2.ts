import type { Instant } from "@/shared/time";
/** Current time is supplied by the caller's runtime, never read by pure domain code. */
export interface Clock { now(): Instant }
/** Produces an opaque identity; domain factories give it the owning nominal type. */
export interface IdGenerator { next(): string }
