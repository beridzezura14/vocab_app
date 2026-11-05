import { randomBytes } from "node:crypto";
import { MongoServerError } from "mongodb";
import { accounts, endSession, ensureEmailIndex, passwordHash, sameOrigin, startSession, verifyPassword } from "../../account";

function message(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return message("Invalid request.", 403);
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = body?.password;
  if (!["login", "register", "upgrade"].includes(action)) return message("Invalid request.", 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return message("Enter a valid email address.", 400);
  }
  if (typeof password !== "string" ||
      password.length < 8 || password.length > 128) {
    return message("Use 8–128 characters for the password.", 400);
  }
  if (action !== "login" && (!name || name.length > 100)) return message("Enter your name.", 400);
  if (action === "upgrade" && !/^[a-z0-9_.-]{3,40}$/.test(username)) return message("Enter your old username.", 400);

  try {
    let accountId: string;
    if (action === "register") {
      await ensureEmailIndex();
      accountId = randomBytes(16).toString("hex");
      const salt = randomBytes(16).toString("hex");
      await accounts().insertOne({ _id: accountId, name, email, salt, passwordHash: await passwordHash(password, salt) });
    } else {
      const account = await accounts().findOne(action === "upgrade" ? { _id: username, email: { $exists: false } } : { email });
      const valid = await verifyPassword(password, account?.salt ?? "unknown-user", account?.passwordHash ?? "0".repeat(128));
      if (!account || !valid) return message(action === "upgrade" ? "Incorrect old username or password." : "Incorrect email or password.", 401);
      accountId = account._id;
      if (action === "upgrade") {
        await ensureEmailIndex();
        const result = await accounts().updateOne({ _id: accountId, email: { $exists: false } }, { $set: { name, email } });
        if (!result.matchedCount) return message("This account already uses email sign-in.", 409);
      }
    }
    await startSession(accountId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return message("This email address is already in use.", 409);
    return message("Account service is temporarily unavailable.", 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return message("Invalid request.", 403);
  try {
    await endSession();
    return new Response(null, { status: 204 });
  } catch {
    return message("Could not sign out. Please retry.", 503);
  }
}
