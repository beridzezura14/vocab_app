
"use client";

import { useLibrary } from "../use-library";
import { useResumeState } from "../use-resume-state";

import { useSpeakSpanish } from "../speak-spanish";

import { useState } from "react";
import {
  Search,
  Volume2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";

import AddWordSheet from "../components/AddWordSheet";
import EditLibraryDialog from "../components/EditLibraryDialog";
import LibraryActions from "../components/LibraryActions";
import type { LibraryEdit } from "../library-data";


export default function VocabularyPage() {
  const speakSpanish = useSpeakSpanish();
  const { customWords, customLessons, addWords, editLibrary, libraryError } = useLibrary();
  const [action, setAction] = useState<{ target: LibraryEdit; deleting: boolean } | null>(null);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savedLesson, setSelectedLesson] = useResumeState<number>("words");

  // Combined data
  const allWords = customWords;
  const allLessons = customLessons;

  const activeLesson = allLessons.find(
    (lesson) => lesson.id === savedLesson
  );
  const selectedLesson = activeLesson?.id ?? null;
  const activeWordCount = allWords.filter((word) => word.lessonId === selectedLesson).length;

  // Filter words
  const filteredWords = allWords.filter((item) => {
    const matchesLesson =
      selectedLesson === null || item.lessonId === selectedLesson;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      item.spanish.toLowerCase().includes(query) ||
      item.georgian.toLowerCase().includes(query);

    return matchesLesson && matchesSearch;
  });

  const openLesson = (lessonId: number) => {
    setSelectedLesson(lessonId);
    setSearch("");
  };

  const backToLessons = () => {
    setSelectedLesson(null);
    setSearch("");
  };

  function actions(target: LibraryEdit) {
    return (
      <LibraryActions label={`${target.kind === "word" ? target.spanish : target.title} actions`}
        onEdit={() => setAction({ target, deleting: false })}
        onDelete={() => setAction({ target, deleting: true })} />
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {selectedLesson !== null && (
              <button
                type="button"
                onClick={backToLessons}
                className="mb-3 flex items-center gap-1 text-sm font-medium text-[#7054E8]"
              >
                <ChevronLeft size={18} />
                All Lessons
              </button>
            )}

            <h1 className="break-words text-[26px] font-bold tracking-tight text-[#1B1B29]">
              {activeLesson ? activeLesson.title : "My Words"}
            </h1>

            <p className="mt-1 text-[13px] text-[#9292A2]">
              {activeLesson
                ? `${activeWordCount} ${activeWordCount === 1 ? "word" : "words"}`
                : `${allWords.length} words · ${allLessons.length} lessons`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#7054E8] px-4 text-sm font-semibold text-white transition active:scale-95"
          >
            <Plus size={18} />
            Add
          </button>
        </div>

        {libraryError && <p role="alert" className="mb-4 text-sm text-red-700">{libraryError}</p>}
        {!libraryError && allLessons.length === 0 && (
          <p className="rounded-xl border border-[#ECECF2] bg-white p-4 text-sm text-[#777787]">
            Tap Add to create your first lesson and save a word.
          </p>
        )}

        {selectedLesson === null ? (
          /* Lessons List */
          <div className="space-y-3">
            {allLessons.map((lesson) => {
              const count = allWords.filter(
                (word) => word.lessonId === lesson.id
              ).length;

              return (
                <div key={lesson.id} className="flex items-center gap-2 rounded-2xl border border-[#ECECF2] bg-white pr-3">
                <button
                  type="button"
                  onClick={() => openLesson(lesson.id)}
                  className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-[#FAF8FF] active:scale-[0.99]"
                >
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7054E8]">
                    <BookOpen size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold text-[#242435]">
                      {lesson.title}
                    </h2>

                    <p className="mt-1 text-[13px] text-[#9292A2]">
                      {count} {count === 1 ? "word" : "words"}
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    className="shrink-0 text-[#A0A0AF]"
                  />
                </button>
                {actions({ kind: "lesson", id: lesson.id, title: lesson.title })}
                </div>
              );
            })}
          </div>
        ) : (
          /* Selected Lesson */
          <>
            {/* Search */}
            <div className="mb-5 flex h-12 items-center gap-3 rounded-xl border border-[#ECECF2] bg-white px-4">
              <Search
                size={19}
                className="shrink-0 text-[#A0A0AF]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search words..."
                className="min-w-0 flex-1 bg-transparent text-base text-[#242435] outline-none placeholder:text-[#A0A0AF]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-[#A0A0AF]"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {/* Words */}
            <div className="rounded-2xl border border-[#ECECF2] bg-white">
              {filteredWords.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#9292A2]">
                  No words found
                </p>
              ) : (
                filteredWords.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-0 items-center justify-between gap-3 border-b border-[#F0F0F5] px-4 py-4 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[15px] font-semibold text-[#242435]">
                        {item.spanish}
                      </p>

                      <p className="mt-1 break-words text-[13px] text-[#9292A2]">
                        {item.georgian}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakSpanish(item.spanish, item.id)}
                      aria-label={`Pronounce ${item.spanish}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7054E8] active:scale-95"
                    >
                      <Volume2 size={19} />
                    </button>
                    {actions({ kind: "word", id: item.id, spanish: item.spanish, georgian: item.georgian })}
                  </div>
                ))
              )}
            </div>

            <p className="mt-4 text-center text-xs text-[#A0A0AF]">
              {filteredWords.length} words
            </p>
          </>
        )}
      </div>

      {/* Add Word Bottom Sheet */}
      <AddWordSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lessons={allLessons}
        selectedLesson={selectedLesson}
        onAdd={addWords}
      />
      {action && (
        <EditLibraryDialog edit={action.target} deleting={action.deleting} onClose={() => setAction(null)}
          onSave={(target) => editLibrary(target, action.deleting)} />
      )}
    </>
  );
}
