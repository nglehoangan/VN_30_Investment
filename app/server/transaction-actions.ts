"use server";
import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { existingDatabase } from "@/infrastructure/dashboard-support";
import { loadDatabaseConfig } from "@/infrastructure/config/database";
import { openDatabase } from "@/infrastructure/db/client";
import { toPublicError, NotFoundError } from "@/shared/errors";
import type { TransactionResponse } from "@/application/dashboard/transaction-model";
import { assertLocalOrigin, previewTransaction, confirmTransaction } from "./manual-transactions";
import { runtime } from "./runtime";
export async function recordTransaction(mode: "preview" | "confirm", payload: unknown): Promise<TransactionResponse> {
  let client;
  try {
    const h = await headers(); assertLocalOrigin(h.get("origin"), h.get("host"));
    const config = loadDatabaseConfig(process.env, process.cwd());
    if (!existingDatabase(config.filePath)) throw new NotFoundError();
    client = await openDatabase(config);
    if (mode === "preview") return { status: "PREVIEW", ...await previewTransaction(client, payload, runtime.clock) };
    if (mode !== "confirm") throw new NotFoundError();
    const { result, transactionId } = await confirmTransaction(client, payload, runtime.clock);
    revalidatePath("/", "layout");
    return { status: "POSTED", transactionId, message: result.actionabilityBlocked ? "Transaction recorded. Portfolio projection is blocked or stale; inspect data status. Do not record it again." : "Transaction recorded. Portfolio accounting recomputed by M6.3." };
  } catch (error) { return { status: "ERROR", message: toPublicError(error).message }; }
  finally { await client?.$disconnect(); }
}
