
"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { MAX_WORDS_PER_BATCH, type WordPair } from "../library-data";

type Lesson = {
  id: number;
  title: string;
  description: string;
};

type AddWordSheetProps = {
  open: boolean;
  onClose: () => void;
  lessons: Lesson[];
  selectedLesson: number | null;
  onAdd: (
    words: WordPair[],
    lesson: number | string
  ) => Promise<number>;
};

export default function AddWordSheet({
  open,
  onClose,
  lessons,
  selectedLesson,
  onAdd,
}: AddWordSheetProps) {
  const [mounted, setMounted] = useState(false);

  const [spanish, setSpanish] = useState("");
  const [georgian, setGeorgian] = useState("");
  const [bulk, setBulk] = useState(false);
  const [list, setList] = useState("");

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialize = useEffectEvent(() => {
    setLessonId(selectedLesson ?? lessons[0]?.id ?? null);
    setMode(lessons.length ? "existing" : "new");
    setNewLessonTitle("");
    setError("");
  });
  const dismiss = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    initialize();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const rows = list.split(/\r?\n/).flatMap((line, index) => {
    if (!line.trim()) return [];
    const pair = /^(.*?)(?:[—–]|\s+-\s+|\t)(.*)$/.exec(line);
    return [{ line: index + 1, spanish: pair?.[1].trim() ?? "", georgian: pair?.[2].trim() ?? "" }];
  });
  const invalidRow = rows.find(({ spanish, georgian }) =>
    !spanish || !georgian || spanish.length > 500 || georgian.length > 500
  );
  const listError = rows.length > MAX_WORDS_PER_BATCH
    ? `Paste up to ${MAX_WORDS_PER_BATCH} words at a time.`
    : invalidRow ? `Check line ${invalidRow.line}. Enter a word and translation separated by a dash.` : "";
  const canSave =
    !saving && (bulk ? rows.length > 0 && !listError : spanish.trim().length > 0 && georgian.trim().length > 0) &&
    (mode === "new"
      ? newLessonTitle.trim().length > 0
      : lessonId !== null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSave) return;

    const lesson = mode === "new" ? newLessonTitle.trim() : lessonId;
    if (lesson === null) return;
    setSaving(true);
    setError("");
    try {
      const words = bulk
        ? rows.map(({ spanish, georgian }) => ({ spanish, georgian }))
        : [{ spanish: spanish.trim(), georgian: georgian.trim() }];
      await onAdd(words, lesson);
      setList("");
      setSpanish("");
      setGeorgian("");
      onClose();
    } catch {
      setError("Could not save your words. Please retry.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close add word dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/45"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-word-title"
          className="pointer-events-auto flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
        >
          <div className="shrink-0 px-5 pt-3">
            <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-[#E5E5ED] sm:hidden" />

            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="add-word-title"
                  className="text-xl font-bold text-[#1B1B29]"
                >
                  Add New Word
                </h2>

                <p className="mt-1 text-sm text-[#9292A2]">
                  Add words to your lessons
                </p>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F8] text-[#777787]"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F5F5F9] p-1">
                {[false, true].map((value) => (
                  <button key={String(value)} type="button" disabled={saving} aria-pressed={bulk === value}
                    onClick={() => { setBulk(value); setError(""); }}
                    className={`min-h-11 rounded-lg text-sm font-medium ${bulk === value ? "bg-white text-[#7054E8] shadow-sm" : "text-[#626274]"}`}>
                    {value ? "Paste a list" : "Single word"}
                  </button>
                ))}
              </div>
              {bulk ? (
                <div className="space-y-2">
                  <label htmlFor="word-list" className="block text-sm font-semibold">Word list</label>
                  <textarea id="word-list" rows={5} value={list} disabled={saving}
                    onChange={(event) => { setList(event.target.value); setError(""); }}
                    placeholder={"Siempre — ყოველთვის\nNunca — არასდროს"}
                    className="w-full rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] p-3 text-base outline-none focus:border-[#7054E8]" />
                  <p className="text-xs text-[#626274]">One word and translation per line, separated by a dash.</p>
                  {listError && <p role="alert" className="text-sm text-red-700">{listError}</p>}
                  {rows.length > 0 && !listError && (
                    <ul aria-label="Word preview" className="max-h-40 divide-y divide-[#E7E7EF] overflow-y-auto rounded-xl border border-[#E7E7EF]">
                      {rows.map((row) => (
                        <li key={row.line} className="grid grid-cols-2 gap-2 px-3 py-2 text-sm">
                          <span className="wrap-break-word font-semibold">{row.spanish}</span>
                          <span className="wrap-break-word text-[#626274]">{row.georgian}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
              <>
              <div>
                <label
                  htmlFor="spanish-word"
                  className="mb-2 block text-sm font-semibold text-[#242435]"
                >
                  Spanish word
                </label>

                <input
                  id="spanish-word"
                  type="text"
                  value={spanish}
                  onChange={(event) => setSpanish(event.target.value)}
                  placeholder="e.g. Hola"
                  autoComplete="off"
                  maxLength={500}
                  required
                  className="h-[52px] w-full rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] px-4 text-base text-[#242435] outline-none focus:border-[#7054E8]"
                />
              </div>

              <div>
                <label
                  htmlFor="georgian-word"
                  className="mb-2 block text-sm font-semibold text-[#242435]"
                >
                  Georgian translation
                </label>

                <input
                  id="georgian-word"
                  type="text"
                  value={georgian}
                  onChange={(event) => setGeorgian(event.target.value)}
                  placeholder="მაგ. გამარჯობა"
                  autoComplete="off"
                  maxLength={500}
                  required
                  className="h-[52px] w-full rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] px-4 text-base text-[#242435] outline-none focus:border-[#7054E8]"
                />
              </div>
              </>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#242435]">
                  Lesson
                </label>

                <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-[#F5F5F9] p-1">
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    className={`min-h-11 rounded-lg text-sm font-medium transition ${
                      mode === "existing"
                        ? "bg-white text-[#7054E8] shadow-sm"
                        : "text-[#888898]"
                    }`}
                  >
                    Existing
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={`min-h-11 rounded-lg text-sm font-medium transition ${
                      mode === "new"
                        ? "bg-white text-[#7054E8] shadow-sm"
                        : "text-[#888898]"
                    }`}
                  >
                    + New Lesson
                  </button>
                </div>

                {mode === "existing" ? (
                  <div className="relative">
                    <select
                      aria-label="Choose lesson"
                      value={lessonId ?? ""}
                      onChange={(event) =>
                        setLessonId(Number(event.target.value))
                      }
                      className="h-[52px] w-full appearance-none rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] px-4 pr-10 text-base text-[#242435] outline-none focus:border-[#7054E8]"
                    >
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9292A2]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newLessonTitle}
                    onChange={(event) =>
                      setNewLessonTitle(event.target.value)
                    }
                    placeholder="e.g. გაკვეთილი 4"
                    autoComplete="off"
                    aria-label="New lesson title"
                    className="h-[52px] w-full rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] px-4 text-base text-[#242435] outline-none focus:border-[#7054E8]"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={!canSave}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={19} />
                {saving ? "Saving…" : bulk ? `Save ${rows.length} ${rows.length === 1 ? "word" : "words"}` : "Save Word"}
              </button>

              <p className="text-center text-xs text-[#9292A2]">
                {error && <span role="alert" className="text-red-700">{error}</span>}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
