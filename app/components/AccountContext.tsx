"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export const AccountContext = createContext("");
type Profile = { name: string; email?: string };
export const ProfileContext = createContext<Profile>({ name: "" });
export const CloudPronunciationContext = createContext(false);
export const SuccessNoticeContext = createContext<(message: string) => void>(() => {});

export function AccountProvider({ username, profile, cloudPronunciation, children }: {
  username: string; profile: Profile; cloudPronunciation: boolean; children: ReactNode;
}) {
  const [notice, setNotice] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <AccountContext.Provider value={username}>
      <ProfileContext.Provider value={profile}>
        <SuccessNoticeContext.Provider value={(message) => setNotice({ message })}>
          <CloudPronunciationContext.Provider value={cloudPronunciation}>{children}</CloudPronunciationContext.Provider>
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
