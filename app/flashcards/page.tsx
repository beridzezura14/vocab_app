
"use client";

import { speakSpanish } from "../speak-spanish";

import { shuffle } from "../shuffle";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  X,
  Trophy,
} from "lucide-react";

import {
  words,
  lessons as defaultLessons,
  type Word,
} from "@/data/words";

type Lesson = {
  id: number;
  title: string;
  description: string;
};

type AnsweredCard = {
  word: Word;
  known: boolean;
  round: number;
  position: number;
  total: number;
};

type StudySession = {
  lesson: Lesson;
  queue: Word[];
  missed: Word[];
  history: AnsweredCard[];
  reviewIndex: number;
  index: number;
  knownCount: number;
  round: number;
  flipped: boolean;
  completed: boolean;
};

const WORDS_KEY = "lingua-custom-words";
const LESSONS_KEY = "lingua-custom-lessons";

export default function FlashcardsPage() {
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [session, setSession] = useState<StudySession | null>(null);

  useEffect(() => {
    try {
      const savedWords = localStorage.getItem(WORDS_KEY);
      const savedLessons = localStorage.getItem(LESSONS_KEY);

      if (savedWords) {
        const parsed: unknown = JSON.parse(savedWords);

        if (Array.isArray(parsed)) {
          setCustomWords(
            parsed
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
              }))
          );
        }
      }

      if (savedLessons) {
        const parsed: unknown = JSON.parse(savedLessons);

        if (Array.isArray(parsed)) {
          setCustomLessons(
            parsed.filter(
              (item): item is Lesson =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "number" &&
                typeof item.title === "string" &&
                typeof item.description === "string"
            )
          );
        }
      }
    } catch (error) {
      console.error("Could not load study data:", error);
    }
  }, []);

  const allWords = [...customWords, ...words];
  const allLessons = [...defaultLessons, ...customLessons];

  const startLesson = (lesson: Lesson) => {
    const lessonWords = allWords.filter(
      (word) => word.lessonId === lesson.id
    );

    if (lessonWords.length === 0) return;

    setSession({
      lesson,
      queue: shuffle(lessonWords),
      missed: [],
      history: [],
      reviewIndex: 0,
      index: 0,
      knownCount: 0,
      round: 1,
      flipped: false,
      completed: false,
    });
  };

  const answer = (known: boolean) => {
    setSession((previous) => {
      if (!previous || previous.completed || previous.reviewIndex < previous.history.length) {
        return previous;
      }

      const currentWord = previous.queue[previous.index];
      if (!currentWord) return previous;

      const missed = known
        ? previous.missed
        : [...previous.missed, currentWord];

      const knownCount = previous.knownCount + (known ? 1 : 0);
      const nextIndex = previous.index + 1;
      const answeredCard: AnsweredCard = {
        word: currentWord,
        known,
        round: previous.round,
        position: nextIndex,
        total: previous.queue.length,
      };
      const history = [...previous.history, answeredCard];
      const answered = {
        ...previous,
        history,
        reviewIndex: history.length,
        knownCount,
        flipped: false,
      };

      // More cards remain in this round.
      if (nextIndex < previous.queue.length) {
        return {
          ...answered,
          missed,
          index: nextIndex,
        };
      }

      // All words have been learned.
      if (missed.length === 0) {
        return {
          ...answered,
          missed: [],
          completed: true,
        };
      }

      // Repeat only missed words.
      return {
        ...answered,
        queue: missed,
        missed: [],
        index: 0,
        round: previous.round + 1,
      };
    });
  };

  const moveCard = (direction: -1 | 1) => {
    setSession((previous) => {
      if (!previous) return previous;
      const reviewIndex = previous.reviewIndex + direction;
      if (reviewIndex < 0 || reviewIndex > previous.history.length) return previous;
      return { ...previous, reviewIndex, flipped: false };
    });
  };

  const reviewedCard = session?.history[session.reviewIndex];
  const currentWord = reviewedCard?.word ?? session?.queue[session.index];

  const totalWords = session
    ? allWords.filter((word) => word.lessonId === session.lesson.id).length
    : 0;

  const progress = session && totalWords > 0
    ? Math.min(100, (session.knownCount / totalWords) * 100)
    : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      {!session ? (
        <>
          <div className="mb-6">
            <h1 className="text-[26px] font-bold tracking-tight text-[#1B1B29]">
              Learn
            </h1>
            <p className="mt-1 text-[13px] text-[#9292A2]">
              Choose a lesson to practice your vocabulary
            </p>
          </div>

          <div className="space-y-3">
            {allLessons.map((lesson) => {
              const count = allWords.filter(
                (word) => word.lessonId === lesson.id
              ).length;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => startLesson(lesson)}
                  disabled={count === 0}
                  className="flex w-full items-center gap-4 rounded-2xl border border-[#ECECF2] bg-white p-4 text-left transition hover:border-[#D8CFFF] active:scale-[0.99] disabled:opacity-50"
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
        </>
      ) : session.completed && !reviewedCard ? (
        <div className="flex min-h-[65dvh] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7054E8]">
            <Trophy size={38} />
          </div>

          <h1 className="text-[27px] font-bold text-[#1B1B29]">
            Lesson Completed!
          </h1>

          <p className="mt-3 max-w-xs text-sm leading-6 text-[#9292A2]">
            Great job! You have successfully reviewed all{" "}
            {totalWords} words in {session.round}{" "}
            {session.round === 1 ? "round" : "rounds"}.
          </p>

          <div className="mt-8 flex w-full max-w-sm gap-3">
            <button
              type="button"
              onClick={() => setSession(null)}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#E7E7EF] bg-white text-sm font-semibold text-[#242435]"
            >
              All Lessons
            </button>

            <button
              type="button"
              onClick={() => startLesson(session.lesson)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white"
            >
              <RotateCcw size={17} />
              Practice Again
            </button>
          </div>
          <button
            type="button"
            onClick={() => moveCard(-1)}
            className="mt-4 flex h-11 items-center gap-2 rounded-full bg-[#F5F3FF] px-5 text-sm font-medium text-[#7054E8]"
          >
            <ChevronLeft size={18} />
            Review Cards
          </button>
        </div>
      ) : currentWord ? (
        <>
          {/* Study header */}
          <div className="mb-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSession(null)}
              className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#777787]"
            >
              <ArrowLeft size={19} />
              <span className="truncate">{session.lesson.title}</span>
            </button>

            <span className="shrink-0 rounded-full bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#7054E8]">
              Round {reviewedCard?.round ?? session.round}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs text-[#9292A2]">
              <span>
                {session.knownCount} / {totalWords} learned
              </span>
              <span>
                {reviewedCard?.position ?? session.index + 1} / {reviewedCard?.total ?? session.queue.length}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[#ECEAF8]">
              <div
                className="h-full rounded-full bg-[#7054E8] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div className="mx-auto w-full max-w-md [perspective:1200px]">
            <button
              type="button"
              onClick={() =>
                setSession((previous) =>
                  previous
                    ? { ...previous, flipped: !previous.flipped }
                    : previous
                )
              }
              aria-label="Flip flashcard"
              className="block h-[290px] w-full cursor-pointer rounded-[26px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[#7054E8] sm:h-[340px]"
            >
              <div
                className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
                style={{
                  transform: session.flipped
                    ? "rotateY(180deg)"
                    : "rotateY(0deg)",
                }}
              >
                {/* Spanish */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[26px] border border-[#E8E4FF] bg-gradient-to-br from-white to-[#F8F6FF] px-5 shadow-sm [backface-visibility:hidden]">
                  <span className="absolute top-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#A49BBE]">
                    Spanish
                  </span>

                  <span className="break-words text-[clamp(25px,6vw,36px)] font-bold leading-tight text-[#242435]">
                    {currentWord.spanish}
                  </span>

                  <span className="absolute bottom-6 text-xs text-[#A0A0AF]">
                    Tap to reveal translation
                  </span>
                </div>

                {/* Georgian */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[26px] border border-[#DDD5FF] bg-[#7054E8] px-5 text-white shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="absolute top-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
                    Georgian
                  </span>

                  <span className="break-words text-[clamp(25px,6vw,36px)] font-bold leading-tight">
                    {currentWord.georgian}
                  </span>

                  <span className="absolute bottom-6 text-xs text-white/65">
                    Tap to flip back
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Pronunciation */}
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              aria-label="Previous card"
              onClick={() => moveCard(-1)}
              disabled={session.reviewIndex === 0}
              className="flex size-11 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7054E8] disabled:opacity-40"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => speakSpanish(currentWord.spanish)}
              className="flex h-11 items-center gap-2 rounded-full bg-[#F5F3FF] px-5 text-sm font-medium text-[#7054E8]"
            >
              <Volume2 size={18} />
              Listen
            </button>
            <button
              type="button"
              aria-label={session.completed && session.reviewIndex === session.history.length - 1
                ? "Back to lesson summary"
                : "Next card"}
              onClick={() => moveCard(1)}
              disabled={!reviewedCard}
              className="flex size-11 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7054E8] disabled:opacity-40"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Answer buttons */}
          {reviewedCard ? (
            <p className="mx-auto mt-8 flex h-14 items-center justify-center gap-2 text-sm font-semibold" role="status">
              {reviewedCard.known ? <Check size={20} /> : <X size={20} />}
              {reviewedCard.known ? "Marked: I Know" : "Marked: Don't Know"}
            </p>
          ) : (
            <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answer(false)}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#F5D9DE] bg-[#FFF3F4] text-sm font-semibold text-[#D55A70] active:scale-[0.98]"
              >
                <X size={20} />
                Don&apos;t Know
              </button>

              <button
                type="button"
                onClick={() => answer(true)}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#CDEBDD] bg-[#EFFBF5] text-sm font-semibold text-[#23986B] active:scale-[0.98]"
              >
                <Check size={20} />
                I Know
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-xs text-[#A0A0AF]">
            Unknown words will repeat until you learn them
          </p>
        </>
      ) : null}
    </div>
  );
}
