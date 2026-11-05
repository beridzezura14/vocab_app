
"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X, Plus, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

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
    spanish: string,
    georgian: string,
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

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const spanishRef = useRef<HTMLInputElement>(null);
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

  const canSave =
    !saving && spanish.trim().length > 0 &&
    georgian.trim().length > 0 &&
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
      const targetLessonId = await onAdd(spanish.trim(), georgian.trim(), lesson);
      setLessonId(targetLessonId);
      setMode("existing");
      setNewLessonTitle("");
      setSpanish("");
      setGeorgian("");
      spanishRef.current?.focus();
    } catch {
      setError("Could not save this word. Please retry.");
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
              <div>
                <label
                  htmlFor="spanish-word"
                  className="mb-2 block text-sm font-semibold text-[#242435]"
                >
                  Spanish word
                </label>

                <input
                  ref={spanishRef}
                  id="spanish-word"
                  type="text"
                  value={spanish}
                  onChange={(event) => setSpanish(event.target.value)}
                  placeholder="e.g. Hola"
                  autoComplete="off"
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
                  required
                  className="h-[52px] w-full rounded-xl border border-[#E7E7EF] bg-[#FAFAFC] px-4 text-base text-[#242435] outline-none focus:border-[#7054E8]"
                />
              </div>

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
                {saving ? "Saving…" : "Save Word"}
              </button>

              <p className="text-center text-xs text-[#9292A2]">
                {error ? <span role="alert" className="text-red-700">{error}</span> : "Save and continue adding more words"}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
