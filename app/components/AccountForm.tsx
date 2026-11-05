"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, Languages, Layers3, Volume2 } from "lucide-react";
import { PasswordRecovery } from "./PasswordRecovery";

const features = [
  { icon: BookOpen, title: "Personal lessons", description: "Group new words by topic or lesson." },
  { icon: Volume2, title: "Pronunciation", description: "Hear how a word is pronounced." },
  { icon: Layers3, title: "Flashcard practice", description: "Review the words you’re still learning." },
];

const inputClass = "mt-2 w-full rounded-xl border border-[#E5E0F1] bg-[#FBFAFF] px-4 py-3 text-base outline-none transition focus:border-[#7054E8] focus:ring-2 focus:ring-[#7054E8]/20";

export default function AccountForm() {
  const [mode, setMode] = useState<"login" | "register" | "upgrade" | "forgot" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const register = mode === "register";
  const upgrade = mode === "upgrade";

  function chooseMode(next: typeof mode) {
    setError("");
    setShowPassword(false);
    setMode(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email: form.get("email"),
          name: form.get("name"),
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
      window.location.replace("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please retry.");
      setBusy(false);
    }
  }

  if (mode === "forgot") return <PasswordRecovery onBack={() => chooseMode("login")} />;

  if (!mode) {
    return (
      <main className="min-h-dvh bg-[#F7F6FC] px-4 pb-10 sm:px-8">
        <header className="mx-auto flex max-w-6xl items-center justify-between py-5 sm:py-6">
          <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-[#6245D4] text-white">
              <Languages size={20} />
            </span>
            <span>Lingua<span className="text-[#6245D4]">.</span></span>
          </div>
          <button type="button" onClick={() => chooseMode("login")}
            className="rounded-xl border border-[#E5E0F1] bg-white px-4 py-2 text-sm font-semibold text-[#5038B9] transition hover:bg-[#EEE8FF]">
            Sign in
          </button>
        </header>

        <section className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[#201636] px-6 py-16 text-center text-white sm:rounded-[36px] sm:px-12 sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#5C408F_0%,transparent_65%)]" />
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#DED0FF]">
            Your language notebook
          </p>
          <h1 className="mx-auto max-w-3xl text-[clamp(2.45rem,7vw,5.25rem)] font-bold leading-[1.04] tracking-[-0.055em]">
            Keep the words <span className="text-[#D8C3FF]">you want to learn.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#E2DAED] sm:text-lg">
            Save new words, group them into lessons, and practice a little each day.
          </p>
          <button type="button" onClick={() => chooseMode("register")}
            className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl bg-[#E9DFFF] px-5 py-3 font-semibold text-[#271745] transition hover:bg-white">
            Create an account <ArrowRight size={18} />
          </button>
        </section>

        <section aria-label="Learning tools" className="mx-auto mt-4 max-w-6xl">
          <ul className="grid gap-3 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3 rounded-2xl border border-[#EDE7F8] bg-white p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F3EEFF] text-[#6245D4]">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-[#626274]">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-linear-to-br from-[#FAF8FF] via-[#F3EBFF] to-[#FFF2EB] px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
      <button type="button" disabled={busy} onClick={() => chooseMode(null)}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-[#7054E8]">
        <ArrowLeft size={16} /> Back to home
      </button>
      <form key={mode} onSubmit={submit} className="space-y-5 rounded-[26px] border border-white bg-white p-6 shadow-xl shadow-[#5038B9]/10 sm:p-8">
        <div>
          <span className="mb-4 grid size-11 place-items-center rounded-xl bg-[#F3EEFF] text-[#6245D4]">
            <Languages size={22} />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            {upgrade ? "Switch to email sign-in" : register ? "Create an account" : "Sign in to Lingua"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#626274]">
            {upgrade ? "Use your old username and password to keep your lessons and link an email." :
              register ? "Start building your personal vocabulary." : "Open your lessons and pick up where you left off."}
          </p>
        </div>
        {(register || upgrade) && (
          <label className="block text-sm font-medium">
            Name
            <input name="name" autoComplete="name" required maxLength={100} className={inputClass} />
          </label>
        )}
        {upgrade && (
          <label className="block text-sm font-medium">
            Old username
            <input name="username" autoComplete="username" required minLength={3} maxLength={40} className={inputClass} />
          </label>
        )}
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" autoComplete={upgrade ? "email" : "username"}
            required maxLength={254} className={inputClass} />
        </label>
        <div>
          <label htmlFor="account-password" className="text-sm font-medium">Password</label>
          <div className="relative">
            <input id="account-password" name="password" type={showPassword ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"} required minLength={8} maxLength={128}
              className={`${inputClass} pr-12`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"} aria-controls="account-password"
              className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-lg text-[#626274] hover:bg-[#EEE8FF]">
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-[#6245D4] py-3 font-semibold text-white transition hover:bg-[#5038B9] disabled:opacity-60">
          {busy ? "Please wait…" : upgrade ? "Link email" : register ? "Register" : "Sign in"}
        </button>
        <button type="button" disabled={busy} onClick={() => chooseMode(register || upgrade ? "login" : "register")}
          className="w-full text-sm font-medium text-[#7054E8]">
          {upgrade ? "Back to sign in" : register ? "Already have an account? Sign in" : "Create an account"}
        </button>
        {mode === "login" && (
          <button type="button" disabled={busy} onClick={() => chooseMode("forgot")}
            className="w-full text-sm font-medium text-[#7054E8]">
            Forgot password?
          </button>
        )}
        {mode === "login" && (
          <button type="button" disabled={busy} onClick={() => chooseMode("upgrade")}
            className="w-full text-xs font-medium text-[#626274] hover:underline">
            Previously signed in with a username?
          </button>
        )}
      </form>
      </div>
    </main>
  );
}
