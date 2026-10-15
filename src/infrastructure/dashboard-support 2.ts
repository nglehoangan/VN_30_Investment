import { existsSync } from "node:fs";
import { randomBytes, createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ValidationError } from "@/shared/errors";
const secret = randomBytes(32);
const sign = (body: string) => createHmac("sha256", secret).update(body).digest("hex");
export const existingDatabase = (filePath: string) => existsSync(filePath);
export function sealConfirmation(value: unknown) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function openConfirmation(token: unknown): unknown {
  const invalid = () => new ValidationError([{ field: "$", reason: "Invalid confirmation", expected: "Server-issued signed confirmation" }]);
  if (typeof token !== "string" || token.length > 16000) throw invalid();
  const [body, mac, extra] = token.split(".");
  if (extra || !body || !mac || !/^[a-f0-9]{64}$/.test(mac) || !timingSafeEqual(Buffer.from(sign(body)), Buffer.from(mac))) throw invalid();
  return JSON.parse(Buffer.from(body, "base64url").toString());
}

export const reviewIdentity = (scope: string) => `review-${createHash("sha256").update(scope).digest("hex")}`;
