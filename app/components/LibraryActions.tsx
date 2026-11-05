"use client";

import { EllipsisVertical } from "lucide-react";

export default function LibraryActions({ label, onEdit, onDelete }: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <details name="library-actions" className="relative shrink-0"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}>
      <summary aria-label={label}
        className="grid size-11 cursor-pointer list-none place-items-center rounded-xl bg-[#F5F3FF] text-[#7054E8] [&::-webkit-details-marker]:hidden">
        <EllipsisVertical size={20} />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-32 rounded-xl border border-[#ECECF2] bg-white p-1 shadow-lg">
        <button type="button" onClick={(event) => { event.currentTarget.closest("details")!.open = false; onEdit(); }}
          className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F5F3FF]">Edit</button>
        <button type="button" onClick={(event) => { event.currentTarget.closest("details")!.open = false; onDelete(); }}
          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Delete</button>
      </div>
    </details>
  );
}
