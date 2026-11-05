
"use client";

import { useEffect, useState } from "react";
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
import {
  words,
  lessons as defaultLessons,
  type Word,
} from "@/data/words";

const WORDS_STORAGE_KEY = "lingua-custom-words";
const LESSONS_STORAGE_KEY = "lingua-custom-lessons";

type Lesson = {
  id: number;
  title: string;
  description: string;
};

export default function VocabularyPage() {
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  // Load local data
  useEffect(() => {
    try {
      const savedWords = localStorage.getItem(WORDS_STORAGE_KEY);
      const savedLessons = localStorage.getItem(LESSONS_STORAGE_KEY);

      if (savedWords) {
        const parsed: unknown = JSON.parse(savedWords);

        if (Array.isArray(parsed)) {
          const validWords: Word[] = parsed
            .filter(
              (item): item is Word =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "number" &&
                typeof item.spanish === "string" &&
                typeof item.georgian === "string"
            )
            .map((item) => ({
              ...item,
              lessonId:
                typeof item.lessonId === "number"
                  ? item.lessonId
                  : 1,
            }));

          setCustomWords(validWords);
        }
      }

      if (savedLessons) {
        const parsed: unknown = JSON.parse(savedLessons);

        if (Array.isArray(parsed)) {
          const validLessons: Lesson[] = parsed.filter(
            (item): item is Lesson =>
              typeof item === "object" &&
              item !== null &&
              typeof item.id === "number" &&
              typeof item.title === "string" &&
              typeof item.description === "string"
          );

          setCustomLessons(validLessons);
        }
      }
    } catch (error) {
      console.error("Could not load saved vocabulary:", error);
    }

    setLoaded(true);
  }, []);

  // Save custom words
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        WORDS_STORAGE_KEY,
        JSON.stringify(customWords)
      );
    } catch (error) {
      console.error("Could not save words:", error);
    }
  }, [customWords, loaded]);

  // Save custom lessons
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        LESSONS_STORAGE_KEY,
        JSON.stringify(customLessons)
      );
    } catch (error) {
      console.error("Could not save lessons:", error);
    }
  }, [customLessons, loaded]);

  // Combined data
  const allWords = [...customWords, ...words];
  const allLessons = [...defaultLessons, ...customLessons];

  const activeLesson = allLessons.find(
    (lesson) => lesson.id === selectedLesson
  );

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

  // Add new word
  const handleAddWord = (
    spanish: string,
    georgian: string,
    lessonId: number
  ) => {
    const newWord: Word = {
      id: Date.now() + Math.floor(Math.random() * 100000),
      spanish,
      georgian,
      lessonId,
    };

    setCustomWords((previous) => [newWord, ...previous]);
  };

  // Create new lesson
  const handleCreateLesson = (title: string): number => {
    const newId = Date.now() + Math.floor(Math.random() * 100000);

    const newLesson: Lesson = {
      id: newId,
      title,
      description: "Custom lesson",
    };

    setCustomLessons((previous) => [...previous, newLesson]);

    return newId;
  };

  // Pronunciation
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      text.split(" / ")[0]
    );

    utterance.lang = "es-ES";
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
  };

  const openLesson = (lessonId: number) => {
    setSelectedLesson(lessonId);
    setSearch("");
  };

  const backToLessons = () => {
    setSelectedLesson(null);
    setSearch("");
  };

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

            <h1 className="text-[26px] font-bold tracking-tight text-[#1B1B29]">
              {activeLesson ? activeLesson.title : "My Words"}
            </h1>

            <p className="mt-1 text-[13px] text-[#9292A2]">
              {activeLesson
                ? activeLesson.description
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

        {selectedLesson === null ? (
          /* Lessons List */
          <div className="space-y-3">
            {allLessons.map((lesson) => {
              const count = allWords.filter(
                (word) => word.lessonId === lesson.id
              ).length;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => openLesson(lesson.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-[#ECECF2] bg-white p-4 text-left transition hover:border-[#D8CFFF] active:scale-[0.99]"
                >
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7054E8]">
                    <BookOpen size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold text-[#242435]">
                      {lesson.title}
                    </h2>

                    <p className="mt-1 text-[13px] text-[#9292A2]">
                      {lesson.description} · {count} სიტყვა
                    </p>
                  </div>

                  <ChevronRight
                    size={20}
                    className="shrink-0 text-[#A0A0AF]"
                  />
                </button>
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
            <div className="overflow-hidden rounded-2xl border border-[#ECECF2] bg-white">
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
                      onClick={() => speak(item.spanish)}
                      aria-label={`Pronounce ${item.spanish}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7054E8] active:scale-95"
                    >
                      <Volume2 size={19} />
                    </button>
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
        onAdd={handleAddWord}
        onCreateLesson={handleCreateLesson}
      />
    </>
  );
}
