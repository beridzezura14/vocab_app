
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import ProfileButton from "./ProfileButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ECECF2] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2"
        >
          <BrandLogo />
        </Link>

        <ProfileButton />
      </div>
    </header>
  );
}
