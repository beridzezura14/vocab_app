"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export const AccountContext = createContext("");
type Profile = { name: string; email?: string; speedRoundBest?: number };
export const ProfileContext = createContext<Profile>({ name: "" });
export const SaveSpeedRoundContext = createContext<(score: number) => Promise<void>>(async () => {});
export const CloudPronunciationContext = createContext(false);
export const SuccessNoticeContext = createContext<(message: string) => void>(() => {});

export function AccountProvider({ username, profile, cloudPronunciation, children }: {
  username: string; profile: Profile; cloudPronunciation: boolean; children: ReactNode;
}) {
  const [notice, setNotice] = useState<{ message: string } | null>(null);
  const [savedBest, setSavedBest] = useState<number>();
  const best = Math.max(profile.speedRoundBest ?? 0, savedBest ?? 0);

  const saveSpeedRound = useCallback(async (score: number) => {
    const response = await fetch("/api/account/speed-round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (!response.ok) throw new Error("Could not save the speed round score.");
    const { best } = await response.json() as { best: number };
    setSavedBest((previous) => Math.max(previous ?? 0, best));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <AccountContext.Provider value={username}>
      <ProfileContext.Provider value={{ ...profile, speedRoundBest: best }}>
        <SuccessNoticeContext.Provider value={(message) => setNotice({ message })}>
          <SaveSpeedRoundContext.Provider value={saveSpeedRound}>
            <CloudPronunciationContext.Provider value={cloudPronunciation}>{children}</CloudPronunciationContext.Provider>
          </SaveSpeedRoundContext.Provider>
          <div role="status" aria-atomic="true"
            className="pointer-events-none fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-[110] flex justify-center">
            {notice && (
              <div className="flex max-w-full items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-[#242435] shadow-lg">
                <CheckCircle2 size={19} className="shrink-0 text-emerald-600" aria-hidden="true" />
                {notice.message}
              </div>
            )}
          </div>
        </SuccessNoticeContext.Provider>
      </ProfileContext.Provider>
    </AccountContext.Provider>
  );
}
