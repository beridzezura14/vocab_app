"use client";

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

function subscribe(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}

function resetToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("reset-password");
}

export function PasswordRecoveryGate({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribe, resetToken, () => null);
  return token === null ? children : <PasswordRecovery key={token} token={token} />;
}

export function PasswordRecovery({ token, onBack }: { token?: string; onBack?: () => void }) {
  const resetting = token !== undefined;
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetting
          ? { action: "reset", token, password: form.get("password") }
          : { action: "request", email: form.get("email") }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setDone(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-xl border border-[#E5E0F1] bg-[#FBFAFF] px-4 py-3";

  return (
    <main className="min-h-dvh bg-[#FAF8FF] px-5 py-16">
      <section className="mx-auto max-w-md space-y-4 rounded-[26px] border border-[#E5E0F1] bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{resetting ? "Set a new password" : "Reset your password"}</h1>
        {done ? (
          <p role="status" className="text-sm leading-6 text-[#626274]">
            {resetting ? "Your password has been changed. Sign in with your new password."
              : "If an account exists for that email, a reset link will be sent."}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {resetting ? (
              <div>
                <label htmlFor="reset-password" className="text-sm font-medium">New password</label>
                <div className="relative">
                  <input id="reset-password" name="password" type={showPassword ? "text" : "password"}
                    autoComplete="new-password" required minLength={8} maxLength={128} className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-lg text-[#626274]">
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
            ) : (
              <label className="block text-sm font-medium">
                Email
                <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
              </label>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-[#6245D4] py-3 font-semibold text-white disabled:opacity-60">
              {busy ? "Please wait…" : resetting ? "Save new password" : "Send reset link"}
            </button>
          </form>
        )}
        <button type="button" disabled={busy} onClick={onBack ?? (() => window.location.replace("/"))}
          className="text-sm font-medium text-[#5038B9]">
          Back to sign in
        </button>
      </section>
    </main>
  );
}
