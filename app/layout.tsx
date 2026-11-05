import type { Metadata, Viewport } from "next";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lingua",
  description: "Personal language learning platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden bg-[#FAFAFC] text-[#1B1B29]">
        <Header />
        <main className="min-w-0 pb-[calc(80px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}