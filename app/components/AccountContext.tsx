"use client";

import { createContext, type ReactNode } from "react";

export const AccountContext = createContext("");
type Profile = { name: string; email?: string };
export const ProfileContext = createContext<Profile>({ name: "" });

export function AccountProvider({ username, profile, children }: { username: string; profile: Profile; children: ReactNode }) {
  return (
    <AccountContext.Provider value={username}>
      <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
    </AccountContext.Provider>
  );
}
