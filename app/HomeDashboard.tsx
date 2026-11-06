
"use client";

import { useLibrary } from "./use-library";
import { useResumeState } from "./use-resume-state";
import WordMatch, { makeMatch, matchCandidates, type MatchSession } from "./components/WordMatch";

import { useSpeakSpanish } from "./speak-spanish";
import { pronunciationText } from "./pronunciation-text";

import { shuffle } from "./shuffle";

import { useContext, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Layers3,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";

import { AccountContext } from "./components/AccountContext";
import AddWordSheet from "./components/AddWordSheet";
import {
  type Word,
} from "@/data/words";

type QuizQuestion = {
  wordId: number;
  question: string;
  options: string[];
  correctIndex: number;
  direction: "es-ka" | "ka-es";
};

type QuizResult = {
  id: number;
  date: string;
  score: number;
  total: number;
};

type QuizSession = {
  mode?: "daily" | "listen";
  quiz: QuizQuestion[];
  questionIndex: number;
  selectedAnswer: number | null;
  score: number;
  quizFinished: boolean;
};

const emptyQuiz: QuizSession = {
  quiz: [],
  questionIndex: 0,
  selectedAnswer: null,
  score: 0,
  quizFinished: false,
};

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function makeQuiz(allWords: Word[], mode: "daily" | "listen"): QuizQuestion[] {
  const uniqueWords = mode === "listen" ? matchCandidates(allWords) : allWords.filter(
    (word, index, array) =>
      array.findIndex(
        (item) =>
          item.spanish.trim().toLowerCase() ===
            word.spanish.trim().toLowerCase() &&
          item.georgian.trim().toLowerCase() ===
            word.georgian.trim().toLowerCase()
      ) === index
  );

  if (uniqueWords.length < 4) return [];

  const selected = shuffle(uniqueWords).slice(0, 10);

  return selected.map((word) => {
    const direction: "es-ka" | "ka-es" =
      mode === "listen" || Math.random() < 0.5 ? "es-ka" : "ka-es";

    const answerField =
      direction === "es-ka" ? "georgian" : "spanish";

    const questionField =
      direction === "es-ka" ? "spanish" : "georgian";

    const correctAnswer = word[answerField];

    const wrongAnswers = shuffle(
      Array.from(
        new Set(
          uniqueWords
            .filter((item) => item.id !== word.id)
            .map((item) => item[answerField])
            .filter((answer) => answer !== correctAnswer)
        )
      )
    ).slice(0, 3);

    const options = shuffle([correctAnswer, ...wrongAnswers]);

    return {
      wordId: word.id,
      question: word[questionField],
      options,
      correctIndex: options.indexOf(correctAnswer),
      direction,
    };
  });
}

export default function HomePage({ practiceOnly = false }: { practiceOnly?: boolean }) {
  const speakSpanish = useSpeakSpanish();
  const username = useContext(AccountContext);
  const quizKey = `lingua-quiz-history:${username}`;
  const { customWords, customLessons, addWords, libraryError } = useLibrary();
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);

  const [quizSession, setQuizSession] = useResumeState<QuizSession>("quiz");
  const [match, setMatch] = useResumeState<MatchSession>("match");
  const { quiz, questionIndex, selectedAnswer, score, quizFinished, mode = "daily" } = quizSession ?? emptyQuiz;
  const listening = mode === "listen";

  useEffect(() => {
    setToday(getLocalDate());

    try {
      const savedHistory = localStorage.getItem(quizKey);

      if (savedHistory) {
        const parsed: unknown = JSON.parse(savedHistory);

        if (Array.isArray(parsed)) {
          setQuizHistory(
            parsed.filter(
              (item): item is QuizResult =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "number" &&
                typeof item.date === "string" &&
                typeof item.score === "number" &&
                typeof item.total === "number"
            )
          );
        }
      }
    } catch (error) {
      console.error("Could not load home data:", error);
    }

    setLoaded(true);
  }, [quizKey]);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(quizKey, JSON.stringify(quizHistory));
    } catch (error) {
      console.error("Could not save home data:", error);
    }
  }, [quizHistory, loaded, quizKey]);

  const allWords = customWords;
  const allLessons = customLessons;
  const matchingWords = matchCandidates(allWords);

  function startMatch(timed = false) {
    if (matchingWords.length < 2) return;
    const session = makeMatch(matchingWords);
    setMatch(timed ? { ...session, speed: { deadline: Date.now() + 60_000, score: 0 } } : session);
  }

  // Deterministic word of the day.
  const dateSeed = today
    ? Number(today.replaceAll("-", ""))
    : 0;

  const dailyWord =
    allWords.length > 0
      ? allWords[dateSeed % allWords.length]
      : null;

  const todayResults = quizHistory.filter(
    (result) => result.date === today
  );

  const todayBestScore = todayResults.reduce(
    (best, result) => Math.max(best, result.score),
    0
  );

  const dailyGoal = Math.min(10, todayBestScore);

  const startQuiz = (mode: "daily" | "listen") => {
    const questions = makeQuiz(allWords, mode);

    if (questions.length === 0) return;

    setQuizSession({ ...emptyQuiz, mode, quiz: questions });
  };

  const currentQuestion = quiz[questionIndex];

  const selectAnswer = (index: number) => {
    if (!quizSession || selectedAnswer !== null) return;
    setQuizSession({ ...quizSession, selectedAnswer: index });
  };

  const nextQuestion = () => {
    if (!quizSession || quizFinished || !currentQuestion || selectedAnswer === null) return;

    const correct = selectedAnswer === currentQuestion.correctIndex;
    const updatedScore = score + (correct ? 1 : 0);

    if (questionIndex + 1 >= quiz.length) {
      const result: QuizResult = {
        id: Date.now(),
        date: getLocalDate(),
        score: updatedScore,
        total: quiz.length,
      };

      if (!listening) setQuizHistory((previous) => [result, ...previous]);
      setQuizSession({ ...quizSession, score: updatedScore, quizFinished: true });
    } else {
      setQuizSession({ ...quizSession, score: updatedScore, questionIndex: questionIndex + 1, selectedAnswer: null });
    }
  };

  const closeQuiz = () => {
    setQuizSession(null);
  };

  const exerciseCards = (
    <>
      {/* Daily Quiz */}
      <div className="mb-5 rounded-[24px] border border-[#ECECF2] bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#242435]">
              Daily Quiz
            </h2>

            <p className="mt-1 text-[13px] text-[#9292A2]">
              10 random words · Mixed languages
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7054E8]">
            <Brain size={24} />
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between text-xs">
          <span className="text-[#9292A2]">
            Spanish ↔ Georgian
          </span>
          <span className="font-semibold text-[#7054E8]">
            10 questions
          </span>
        </div>

        <button
          type="button"
          onClick={() => startQuiz("daily")}
          disabled={allWords.length < 4}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          Start Quiz
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#ECECF2] bg-white p-5">
        <h2 className="text-lg font-bold text-[#242435]">Match Words</h2>
        <p className="mt-1 text-[13px] text-[#626274]">
          {matchingWords.length >= 2 ? "Match up to 6 random words with their translations." : "Add at least 2 different word pairs to play."}
        </p>
        <button type="button" onClick={() => startMatch()} disabled={matchingWords.length < 2}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white disabled:opacity-50">
          Start Matching <ArrowRight size={18} />
        </button>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#ECECF2] bg-white p-5">
        <h2 className="text-lg font-bold text-[#242435]">Listen &amp; Choose</h2>
        <p className="mt-1 text-[13px] text-[#626274]">
          {matchingWords.length >= 4 ? "Listen to a word and choose its translation." : "Add at least 4 different word pairs to play."}
        </p>
        <button type="button" onClick={() => startQuiz("listen")} disabled={matchingWords.length < 4}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white disabled:opacity-50">
          Start Listening <Volume2 size={18} />
        </button>
      </div>

      <div className="mb-5 rounded-[24px] border border-[#ECECF2] bg-white p-5">
        <h2 className="text-lg font-bold text-[#242435]">Speed Round</h2>
        <p className="mt-1 text-[13px] text-[#626274]">
          {matchingWords.length >= 2 ? "Match as many word pairs as you can in 60 seconds." : "Add at least 2 different word pairs to play."}
        </p>
        <button type="button" onClick={() => startMatch(true)} disabled={matchingWords.length < 2}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white disabled:opacity-50">
          Start Speed Round <ArrowRight size={18} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {match ? (
          <WordMatch session={match} onChange={setMatch} onExit={() => setMatch(null)}
            onRestart={() => startMatch(Boolean(match.speed))}
            nextBoard={() => makeMatch(matchingWords.length >= 2 ? matchingWords : match.words)} />
        ) : quiz.length === 0 && practiceOnly ? (
          <>
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-[#242435]">Practice</h1>
              <p className="mt-1 text-sm text-[#626274]">Choose an exercise to practice your vocabulary.</p>
            </header>
            {exerciseCards}
          </>
        ) : quiz.length === 0 ? (
          <>
            {/* Welcome */}
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9292A2]">
                Your learning space
              </p>

              <h1 className="text-[28px] font-bold tracking-tight text-[#1B1B29]">
                ¡Hola! 👋
              </h1>

              <p className="mt-1 text-sm text-[#9292A2]">
                A little practice every day.
              </p>
            </div>

            {/* Word of the day */}
            <div className="relative mb-5 overflow-hidden rounded-[24px] bg-[#7054E8] p-5 text-white">
              <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-20 right-16 h-40 w-40 rounded-full bg-white/5" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#E8DDFF]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E8DDFF]">
                    Word of the day
                  </span>
                </div>

                <h2 className="break-words text-[32px] font-bold tracking-tight">
                  {dailyWord?.spanish ?? "Hola"}
                </h2>

                <p className="mt-2 text-sm text-[#E8DDFF]">
                  {dailyWord?.georgian ?? "გამარჯობა"}
                </p>

                <div className="mt-7 flex items-center justify-between">
                  <span className="text-xs text-[#E8DDFF]">
                    Learn something new today
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      dailyWord && speakSpanish(dailyWord.spanish, dailyWord.id)
                    }
                    aria-label="Listen to word of the day"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 transition active:scale-95"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-2 gap-2.5">
              {[
                {
                  icon: BookOpen,
                  value: allWords.length,
                  label: "Words",
                },
                {
                  icon: Layers3,
                  value: allLessons.length,
                  label: "Lessons",
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="flex min-w-0 flex-col items-center rounded-2xl border border-[#ECECF2] bg-white px-2 py-4"
                  >
                    <Icon
                      size={20}
                      className="mb-2 text-[#7054E8]"
                    />

                    <span className="text-[23px] font-bold text-[#242435]">
                      {stat.value}
                    </span>

                    <span className="mt-1 text-center text-[11px] text-[#9292A2]">
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {exerciseCards}

            {/* Daily Goal */}
            <div className="mb-5 rounded-[24px] border border-[#ECECF2] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#242435]">
                  Daily Goal
                </h2>

                <span className="text-sm font-semibold text-[#7054E8]">
                  {dailyGoal} / 10
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#ECEAF8]">
                <div
                  className="h-full rounded-full bg-[#7054E8] transition-all duration-500"
                  style={{ width: `${dailyGoal * 10}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-[#9292A2]">
                {dailyGoal === 10
                  ? "Daily goal completed! Great job!"
                  : "Answer 10 questions correctly in one quiz to reach your goal."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-5">
              <h2 className="mb-3 text-[17px] font-bold text-[#242435]">
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/vocabulary"
                  className="rounded-2xl border border-[#ECECF2] bg-white p-4"
                >
                  <BookOpen
                    size={22}
                    className="mb-4 text-[#7054E8]"
                  />
                  <p className="text-sm font-semibold text-[#242435]">
                    My Vocabulary
                  </p>
                  <p className="mt-1 text-xs text-[#9292A2]">
                    Browse your words
                  </p>
                  <ChevronRight
                    size={18}
                    className="mt-4 text-[#7054E8]"
                  />
                </Link>

                <Link
                  href="/flashcards"
                  className="rounded-2xl border border-[#ECECF2] bg-white p-4"
                >
                  <Brain
                    size={22}
                    className="mb-4 text-[#7054E8]"
                  />
                  <p className="text-sm font-semibold text-[#242435]">
                    Flashcards
                  </p>
                  <p className="mt-1 text-xs text-[#9292A2]">
                    Practice lessons
                  </p>
                  <ChevronRight
                    size={18}
                    className="mt-4 text-[#7054E8]"
                  />
                </Link>
              </div>
            </div>
          </>
        ) : quizFinished ? (
          /* Quiz Results */
          <div className="flex min-h-[65dvh] flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F3FF] text-[#7054E8]">
              <Trophy size={38} />
            </div>

            <h1 className="text-[27px] font-bold text-[#1B1B29]">
              {listening ? "Listening Complete!" : "Quiz Completed!"}
            </h1>

            <p className="mt-2 text-sm text-[#9292A2]">
              Here's how you did
            </p>

            <div className="my-7 text-[54px] font-bold tracking-tight text-[#7054E8]">
              {score}
              <span className="text-2xl text-[#A0A0AF]">
                /{quiz.length}
              </span>
            </div>

            <p className="mb-8 text-sm text-[#777787]">
              {score === quiz.length
                ? "Perfect score! Amazing work!"
                : score >= 7
                  ? "Great job! Keep practicing."
                  : "Keep learning. You'll get better!"}
            </p>

            <div className="flex w-full max-w-sm gap-3">
              <button
                type="button"
                onClick={closeQuiz}
                className="h-12 flex-1 rounded-xl border border-[#E7E7EF] bg-white text-sm font-semibold text-[#242435]"
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => startQuiz(mode)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white"
              >
                <RotateCcw size={17} />
                Try Again
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          /* Quiz Question */
          <section className="flex min-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] flex-col justify-center">
            <div className="mb-3 flex items-center justify-between sm:mb-7">
              <button
                type="button"
                onClick={closeQuiz}
                className="flex items-center gap-2 text-sm font-medium text-[#777787]"
              >
                <ArrowLeft size={19} />
                {listening ? "Exit Listening" : "Exit Quiz"}
              </button>

              <span className="rounded-full bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#7054E8]">
                {questionIndex + 1} / {quiz.length}
              </span>
            </div>

            <div className="mb-4 h-2 shrink-0 overflow-hidden rounded-full bg-[#ECEAF8] sm:mb-7">
              <div
                className="h-full rounded-full bg-[#7054E8] transition-all duration-300"
                style={{
                  width: `${
                    ((questionIndex + 1) / quiz.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="mb-3 flex min-h-32 flex-col items-center justify-center rounded-[24px] border border-[#E8E4FF] bg-[#F8F6FF] px-4 py-3 text-center sm:mb-6 sm:min-h-[220px]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#A49BBE] sm:mb-5">
                {listening ? "Listen & Choose" : currentQuestion.direction === "es-ka"
                  ? "Spanish → Georgian"
                  : "Georgian → Spanish"}
              </p>

              {listening ? (
                <>
                  <button type="button" onClick={() => speakSpanish(currentQuestion.question, currentQuestion.wordId)}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#7054E8] px-5 text-sm font-semibold text-white">
                    <Volume2 size={20} /> Listen
                  </button>
                  <p lang="es" aria-hidden={selectedAnswer === null}
                    className={`mt-2 max-w-full wrap-anywhere text-xl font-bold text-[#242435] ${selectedAnswer === null ? "invisible" : ""}`}>
                    {pronunciationText(currentQuestion.question)}
                  </p>
                </>
              ) : (
                <h1 className="max-w-full wrap-anywhere text-[clamp(25px,6vw,36px)] font-bold text-[#242435]">
                  {currentQuestion.question}
                </h1>
              )}

              <p className="mt-2 text-xs text-[#9292A2] sm:mt-5">
                Choose the correct translation
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {currentQuestion.options.map((option, index) => {
                const answered = selectedAnswer !== null;
                const correct =
                  index === currentQuestion.correctIndex;
                const selected = index === selectedAnswer;

                let style =
                  "border-[#ECECF2] bg-white text-[#242435]";

                if (answered && correct) {
                  style =
                    "border-[#A8E4C7] bg-[#EFFBF5] text-[#23986B]";
                } else if (answered && selected && !correct) {
                  style =
                    "border-[#F5C5CE] bg-[#FFF3F4] text-[#D55A70]";
                }

                return (
                  <button
                    key={`${index}-${option}`}
                    type="button"
                    onClick={() => selectAnswer(index)}
                    disabled={answered}
                    className={`flex min-h-14 min-w-0 items-center justify-center rounded-2xl border px-2 py-2 text-center text-[14px] font-semibold transition active:scale-[0.98] sm:min-h-[86px] sm:p-3 ${style}`}
                  >
                    <span className="min-w-0 wrap-anywhere">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 mt-3 rounded-xl bg-[#FAFAFC] py-2 sm:static sm:mt-6 sm:p-0">
              <div role="status" className="mb-2 flex h-6 items-center justify-center gap-2 text-center sm:mb-4">
                {selectedAnswer !== null && (selectedAnswer === currentQuestion.correctIndex ? (
                    <>
                      <Check size={19} className="text-[#23986B]" />
                      <span className="text-sm font-semibold text-[#23986B]">
                        Correct answer!
                      </span>
                    </>
                  ) : (
                    <>
                      <X size={19} className="shrink-0 text-[#D55A70]" />
                      <span className="min-w-0 truncate text-sm font-semibold text-[#D55A70]">
                        Correct:{" "}
                        {
                          currentQuestion.options[
                            currentQuestion.correctIndex
                          ]
                        }
                      </span>
                    </>
                  ))}
              </div>

              <button
                type="button"
                onClick={nextQuestion}
                disabled={selectedAnswer === null}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px]"
              >
                {questionIndex === quiz.length - 1
                  ? "See Results"
                  : "Next Question"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {/* Floating Add Button */}
      {!practiceOnly && !match && quiz.length === 0 && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Add new word"
          className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#7054E8] text-white shadow-[0_8px_28px_rgba(112,84,232,0.35)] transition active:scale-95 sm:right-8"
        >
          <Plus size={26} />
        </button>
      )}

      {libraryError && <p role="alert" className="mx-auto max-w-3xl px-4 text-sm text-red-700">{libraryError}</p>}
      <AddWordSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lessons={allLessons}
        selectedLesson={null}
        onAdd={addWords}
      />
    </>
  );
}
