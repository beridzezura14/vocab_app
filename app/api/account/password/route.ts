import { randomBytes } from "node:crypto";
import { accounts, hashToken, passwordHash, revokeSessions, sameOrigin } from "../../../account";

function message(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return message("Invalid request.", 403);
  const body = await request.json().catch(() => null);

  try {
    if (body?.action === "request") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return message("Enter a valid email address.", 400);
      }

      const { RESEND_API_KEY, PASSWORD_RESET_FROM, APP_URL } = process.env;
      if (!RESEND_API_KEY || !PASSWORD_RESET_FROM || !APP_URL) {
        return message("Password reset email is currently unavailable.", 503);
      }
      const url = new URL("/", APP_URL);
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        return message("Password reset email is currently unavailable.", 503);
      }

      const token = randomBytes(32).toString("base64url");
      const now = Date.now();
      const hash = hashToken(token);
      const account = await accounts().findOneAndUpdate(
        { email, "passwordReset.requestedAt": { $not: { $gt: new Date(now - 60_000) } } },
        { $set: { passwordReset: { hash, requestedAt: new Date(now), expiresAt: new Date(now + 20 * 60_000) } } },
        { projection: { _id: 1 } }
      );
      if (account) {
        url.hash = `reset-password=${token}`;
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: PASSWORD_RESET_FROM,
              to: [email],
              subject: "Reset your Vocab.App password",
              text: `Use this one-time link within 20 minutes to reset your Vocab.App password:\n\n${url}\n\nIf you did not request a reset, you can ignore this email.`,
            }),
            signal: AbortSignal.timeout(10_000),
          });
          if (!response.ok) {
            const result = await response.json().catch(() => null);
            const code = typeof result?.name === "string" && /^[a-z_]+$/.test(result.name) ? result.name : "unknown_error";
            const reason = typeof result?.message === "string" ? result.message : "";
            const hint = /testing emails.*own email address/i.test(reason)
              ? " Test sender is restricted to the Resend account email."
              : /domain.*not verified/i.test(reason) ? " Sender domain is not verified." : "";
            throw new Error(`Resend HTTP ${response.status} (${code}).${hint}`);
          }
        } catch (error) {
          await accounts().updateOne({ _id: account._id, "passwordReset.hash": hash }, { $unset: { passwordReset: "" } });
          console.error("Could not deliver a password reset email.", error instanceof Error ? error.message : "Unknown error");
        }
      }
      return new Response(null, { status: 204 });
    }

    if (body?.action === "reset") {
      const { token, password } = body;
      if (typeof token !== "string" || !/^[\w-]{43}$/.test(token)) {
        return message("This reset link is invalid or has expired.", 400);
      }
      if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return message("Use 8–128 characters for your password.", 400);
      }
      const hash = hashToken(token);
      if (!await accounts().findOne({ "passwordReset.hash": hash, "passwordReset.expiresAt": { $gt: new Date() } }, { projection: { _id: 1 } })) {
        return message("This reset link is invalid or has expired.", 400);
      }
      const salt = randomBytes(16).toString("hex");
      const derived = await passwordHash(password, salt);
      const account = await accounts().findOneAndUpdate(
        { "passwordReset.hash": hash, "passwordReset.expiresAt": { $gt: new Date() } },
        { $set: { salt, passwordHash: derived }, $unset: { passwordReset: "" } },
        { projection: { _id: 1 } }
      );
      if (!account) return message("This reset link is invalid or has expired.", 400);
      await revokeSessions(account._id);
      return new Response(null, { status: 204 });
    }
    return message("Invalid request.", 400);
  } catch {
    return message("Password reset is temporarily unavailable. Please retry.", 503);
  }
}
