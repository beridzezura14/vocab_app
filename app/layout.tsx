import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import AccountForm from "./components/AccountForm";
import { PasswordRecoveryGate } from "./components/PasswordRecovery";
import { AccountProvider } from "./components/AccountContext";
import { accounts, currentAccount } from "./account";
import { cloudPronunciationEnabled } from "./pronunciation-audio";
import { readLibrary } from "./library-store";
import { LibraryProvider } from "./use-library";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vocab.App",
  description: "Personal language learning platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function AccountShell({ children }: { children: ReactNode }) {
  const username = await currentAccount();
  if (!username) return <AccountForm />;
  const [account, library] = await Promise.all([
    accounts().findOne({ _id: username }, { projection: { name: 1, email: 1, speedRoundBest: 1 } }),
    readLibrary(username).catch(() => null),
  ]);

  return (
    <AccountProvider username={username} profile={{
      name: account?.name ?? username, email: account?.email, speedRoundBest: account?.speedRoundBest,
    }}
      cloudPronunciation={cloudPronunciationEnabled()}>
      <Header />
      <LibraryProvider key={username} initialLibrary={library}>
        <main className="min-w-0 pb-[calc(80px+env(safe-area-inset-bottom))]">{children}</main>
      </LibraryProvider>
      <BottomNav />
    </AccountProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden bg-[#FAFAFC] text-[#1B1B29]">
        <PasswordRecoveryGate>
          <Suspense fallback={<div role="status" className="p-6 text-sm text-[#626274]">Loading…</div>}>
            <AccountShell>{children}</AccountShell>
          </Suspense>
        </PasswordRecoveryGate>
      </body>
    </html>
  );
}
