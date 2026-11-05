
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BookOpen,
  Layers3,
  ChartNoAxesColumn,
} from "lucide-react";
import ProfileButton from "./ProfileButton";

const navigation = [
  { label: "Home", href: "/", icon: House },
  { label: "Words", href: "/vocabulary", icon: BookOpen },
  { label: "Learn", href: "/flashcards", icon: Layers3 },
  { label: "Stats", href: "/statistics", icon: ChartNoAxesColumn },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-[#ECECF2] bg-white/95 backdrop-blur-xl"
    >
      <div className="mx-auto grid h-[64px] w-full max-w-2xl grid-cols-5 px-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active ? "text-[#7054E8]" : "text-[#9292A2]"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <ProfileButton inNav />
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
