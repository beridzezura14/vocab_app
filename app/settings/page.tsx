import { BookOpen, ChevronDown, CircleHelp, Info, Layers3, Settings } from "lucide-react";

// The account layout shows the guest landing screen when signed out.
export const instant = false;

const exercises = [
  { name: "Daily Quiz", detail: "Answer up to 10 multiple-choice questions using words from your library." },
  { name: "Match Words", detail: "Tap a Spanish word and its Georgian translation to match up to six pairs." },
  { name: "Listen & Choose", detail: "Listen to a word and choose its translation from four options. The Spanish text appears after you answer." },
  { name: "Speed Round", detail: "Match as many pairs as you can in 60 seconds. Your personal best appears in your profile." },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3 pb-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F0EBFF] text-[#6245D4]">
          <Settings size={22} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#242435]">Settings</h1>
          <p className="text-sm text-[#626274]">About Vocab.App and how to use it</p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#ECECF2] bg-white p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-[#242435]">
          <Info size={19} className="text-[#6245D4]" aria-hidden="true" /> About Vocab.App
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#626274]">
          Vocab.App is your personal vocabulary notebook. Organize words into lessons, listen to pronunciations,
          and practice what you have learned.
        </p>
      </section>

      <section className="rounded-2xl border border-[#ECECF2] bg-white p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-[#242435]">
          <BookOpen size={19} className="text-[#6245D4]" aria-hidden="true" /> Getting started
        </h2>
        <ol className="mt-2 list-decimal space-y-2 ps-5 text-sm leading-6 text-[#626274]">
          <li>Open <strong>Words</strong> and tap <strong>Add</strong> to save a word or paste a list into a lesson.</li>
          <li>Open <strong>Learn</strong> and pick a lesson. Flip each flashcard and mark whether you know it.</li>
          <li>Open <strong>Practice</strong> to review words from your library.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-[#ECECF2] bg-white p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-[#242435]">
          <Layers3 size={19} className="text-[#6245D4]" aria-hidden="true" /> Practice modes
        </h2>
        <div className="mt-2 divide-y divide-[#ECECF2]">
          {exercises.map(({ name, detail }) => (
            <details key={name} className="group py-2">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-[#242435] [&::-webkit-details-marker]:hidden">
                {name}
                <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-[#6245D4] group-open:rotate-180" />
              </summary>
              <p className="pb-1 text-sm leading-6 text-[#626274]">{detail}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#ECECF2] bg-white p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-[#242435]">
          <CircleHelp size={19} className="text-[#6245D4]" aria-hidden="true" /> Where is my progress saved?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#626274]">
          Your words, lessons, and Speed Round best are saved to your account. Open the profile icon at the top
          right to see your best score. Unfinished exercises resume when you reload the same browser tab.
        </p>
      </section>
    </div>
  );
}
