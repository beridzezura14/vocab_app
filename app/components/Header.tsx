
"use client";

import Link from "next/link";
import { Languages, ChevronDown } from "lucide-react";
import ProfileButton from "./ProfileButton";
import { useState } from "react";

export default function Header() {
  const [language, setLanguage] = useState("es");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ECECF2] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7054E8] text-white">
            <Languages size={20} />
          </span>

          <span className="text-xl font-bold tracking-tight text-[#1B1B29]">
            Learn<span className="text-[#7054E8]">.</span>
          </span>
        </Link>

        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <div className="relative">
            <select
              aria-label="Select language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 w-[76px] appearance-none rounded-xl border border-[#ECECF2] bg-[#FAFAFC] pl-3 pr-6 text-xs font-semibold text-[#242435] outline-none focus:border-[#7054E8]"
            >
              <option value="es">🇪🇸 ES</option>
              <option value="en">🇬🇧 EN</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="de">🇩🇪 DE</option>
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#777787]"
            />
          </div>

          <ProfileButton />
        </div>
      </div>
    </header>
  );
}
