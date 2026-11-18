import type {ReviewInput, Ref, Dependencies, review} from './review';
/** Types for the existing ESM runtime; no executable or evidence bytes change. */
export const root: string;
export function canonical(value: unknown): string;
export function pointer(object: unknown, ref?: string): unknown;
export function verifyRef(ref: Ref): unknown;
export function verifyInput(input: ReviewInput): void;
export const assessShares: Dependencies['assessShares'];
export function loadProjectModule(path: string): Promise<unknown>;
export function loadReview(): Promise<typeof review>;
export function run(input: ReviewInput): Promise<ReturnType<typeof review>>;
export function cli(args: string[]): Promise<string>;
