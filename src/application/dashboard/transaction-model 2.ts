import type { Transaction } from "@/domain/portfolio/transaction";
export type TransactionResponse = { status: "ERROR"; message: string } | { status: "PREVIEW"; token: string; transaction: Transaction } | { status: "POSTED"; transactionId: string; message: string };
