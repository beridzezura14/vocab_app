import { Languages } from "lucide-react";

export default function BrandLogo({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#6245D4] text-white">
        <Languages size={21} aria-hidden="true" />
      </span>
      {!iconOnly && (
        <span className="whitespace-nowrap text-xl font-bold tracking-tight text-[#1B1B29]">
          Vocab<span className="text-[#6245D4]">.App</span>
        </span>
      )}
    </span>
  );
}
