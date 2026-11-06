import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { database } from "./database";

const cookieName = "lingua-session";
const lifetime = 60 * 60 * 24 * 30;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const accounts = () => database().collection<{
  _id: string;
  email?: string;
  name?: string;
  speedRoundBest?: number;
  salt: string;
  passwordHash: string;
  passwordReset?: { hash: string; expiresAt: Date; requestedAt: Date };
}>("accounts");

let emailIndex: Promise<string> | undefined;

export function ensureEmailIndex() {
  emailIndex ??= accounts().createIndex({ email: 1 }, { unique: true, sparse: true }).catch((error: unknown) => {
    emailIndex = undefined;
    throw error;
  });
  return emailIndex;
}

const sessions = () => database().collection<{
  _id: string;
  username: string;
  expiresAt: Date;
}>("sessions");

export async function passwordHash(password: string, salt: string) {
  return new Promise<string>((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key.toString("hex"));
    });
  });
}

export async function verifyPassword(password: string, salt: string, expected: string) {
  const actual = await passwordHash(password, salt);
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function currentAccount() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  await connection();
  const session = await sessions().findOne({
    _id: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  return session?.username ?? null;
}

export async function startSession(username: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + lifetime * 1000);
  await sessions().insertOne({ _id: hashToken(token), username, expiresAt });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) await sessions().deleteOne({ _id: hashToken(token) });
  store.delete(cookieName);
}

export async function revokeSessions(username: string) {
  await sessions().deleteMany({ username });
  (await cookies()).delete(cookieName);
}

export function sameOrigin(request: Request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
