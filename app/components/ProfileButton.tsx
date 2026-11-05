"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import { UserRound, X } from "lucide-react";
import { ProfileContext } from "./AccountContext";

export default function ProfileButton({ inNav = false }: { inNav?: boolean }) {
  const profile = useContext(ProfileContext);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error();
      window.location.replace("/");
    } catch {
      setError("Could not sign out. Please retry.");
      setBusy(false);
    }
  }

  return (
    <div ref={container} className="relative min-w-0"
      onKeyDown={(event) => { if (open && event.key === "Escape") close(); }}>
      <button ref={trigger} type="button" aria-label="Profile" aria-expanded={open} aria-controls={panelId}
        onClick={() => { setError(""); setOpen(!open); }}
        className={inNav
          ? "flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium text-[#9292A2]"
          : "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7054E8]"}>
        <UserRound size={inNav ? 21 : 19} strokeWidth={1.8} />
        {inNav && <span>Profile</span>}
      </button>
      <section id={panelId} hidden={!open} aria-labelledby={titleId}
        className={`absolute w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#ECECF2] bg-white p-4 text-[#242435] shadow-xl ${inNav ? "bottom-full right-3 mb-2" : "right-0 top-full mt-2"}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold">Profile</h2>
          <button type="button" aria-label="Close profile" onClick={close}
            className="grid size-9 place-items-center rounded-lg text-[#626274] hover:bg-[#F5F3FF]">
            <X size={19} />
          </button>
        </div>
        <p className="mt-3 break-words font-semibold">{profile.name}</p>
        {profile.email && <p className="mt-1 break-words text-sm text-[#626274]">{profile.email}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <button type="button" disabled={busy} onClick={signOut}
          className="mt-5 w-full rounded-xl bg-[#7054E8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </section>
    </div>
  );
}
