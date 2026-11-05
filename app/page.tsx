
"use client";

import { speakSpanish } from "./speak-spanish";

import { shuffle } from "./shuffle";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Flame,
  Layers3,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";

import AddWordSheet from "./components/AddWordSheet";
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

const WORDS_KEY = "lingua-custom-words";
const LESSONS_KEY = "lingua-custom-lessons";
const QUIZ_KEY = "lingua-quiz-history";

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function makeQuiz(allWords: Word[]): QuizQuestion[] {
  const uniqueWords = allWords.filter(
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
      Math.random() < 0.5 ? "es-ka" : "ka-es";

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

export default function HomePage() {
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [customLessons, setCustomLessons] = useState<Lesson[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    setToday(getLocalDate());

    try {
      const savedWords = localStorage.getItem(WORDS_KEY);
      const savedLessons = localStorage.getItem(LESSONS_KEY);
      const savedHistory = localStorage.getItem(QUIZ_KEY);

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
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(WORDS_KEY, JSON.stringify(customWords));
      localStorage.setItem(
        LESSONS_KEY,
        JSON.stringify(customLessons)
      );
      localStorage.setItem(QUIZ_KEY, JSON.stringify(quizHistory));
    } catch (error) {
      console.error("Could not save home data:", error);
    }
  }, [customWords, customLessons, quizHistory, loaded]);

  const allWords = [...customWords, ...words];
  const allLessons = [...defaultLessons, ...customLessons];

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

  const activeDays = new Set(
    quizHistory.map((result) => result.date)
  );

  const calculateStreak = () => {
    if (!today) return 0;

    const cursor = new Date(`${today}T12:00:00`);

    if (!activeDays.has(today)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (true) {
      const key = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");

      if (!activeDays.has(key)) break;

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  };

  const streak = calculateStreak();

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

  const handleCreateLesson = (title: string): number => {
    const id = Date.now() + Math.floor(Math.random() * 100000);

    setCustomLessons((previous) => [
      ...previous,
      {
        id,
        title,
        description: "Custom lesson",
      },
    ]);

    return id;
  };

  const startQuiz = () => {
    const questions = makeQuiz(allWords);

    if (questions.length === 0) return;

    setQuiz(questions);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  const currentQuestion = quiz[questionIndex];

  const selectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const nextQuestion = () => {
    if (!currentQuestion || selectedAnswer === null) return;

    const correct = selectedAnswer === currentQuestion.correctIndex;
    const updatedScore = score + (correct ? 1 : 0);

    setScore(updatedScore);

    if (questionIndex + 1 >= quiz.length) {
      const result: QuizResult = {
        id: Date.now(),
        date: getLocalDate(),
        score: updatedScore,
        total: quiz.length,
      };

      setQuizHistory((previous) => [result, ...previous]);
      setQuizFinished(true);
    } else {
      setQuestionIndex((previous) => previous + 1);
      setSelectedAnswer(null);
    }
  };

  const closeQuiz = () => {
    setQuiz([]);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {quiz.length === 0 ? (
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
                      dailyWord && speakSpanish(dailyWord.spanish)
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
            <div className="mb-6 grid grid-cols-3 gap-2.5">
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
                {
                  icon: Flame,
                  value: streak,
                  label: "Day streak",
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
                onClick={startQuiz}
                disabled={allWords.length < 4}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
              >
                Start Quiz
                <ArrowRight size={18} />
              </button>
            </div>

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
              Quiz Completed!
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
                onClick={startQuiz}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white"
              >
                <RotateCcw size={17} />
                Try Again
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          /* Quiz Question */
          <>
            <div className="mb-7 flex items-center justify-between">
              <button
                type="button"
                onClick={closeQuiz}
                className="flex items-center gap-2 text-sm font-medium text-[#777787]"
              >
                <ArrowLeft size={19} />
                Exit Quiz
              </button>

              <span className="rounded-full bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#7054E8]">
                {questionIndex + 1} / {quiz.length}
              </span>
            </div>

            <div className="mb-7 h-2 overflow-hidden rounded-full bg-[#ECEAF8]">
              <div
                className="h-full rounded-full bg-[#7054E8] transition-all duration-300"
                style={{
                  width: `${
                    ((questionIndex + 1) / quiz.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="mb-6 flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-[#E8E4FF] bg-[#F8F6FF] px-5 text-center">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#A49BBE]">
                {currentQuestion.direction === "es-ka"
                  ? "Spanish → Georgian"
                  : "Georgian → Spanish"}
              </p>

              <h1 className="break-words text-[clamp(25px,6vw,36px)] font-bold text-[#242435]">
                {currentQuestion.question}
              </h1>

              <p className="mt-5 text-xs text-[#9292A2]">
                Choose the correct translation
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    className={`flex min-h-[86px] min-w-0 items-center justify-center rounded-2xl border p-3 text-center text-[14px] font-semibold transition active:scale-[0.98] ${style}`}
                  >
                    <span className="break-words">{option}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div className="mt-6">
                <div className="mb-4 flex items-center justify-center gap-2">
                  {selectedAnswer === currentQuestion.correctIndex ? (
                    <>
                      <Check size={19} className="text-[#23986B]" />
                      <span className="text-sm font-semibold text-[#23986B]">
                        Correct answer!
                      </span>
                    </>
                  ) : (
                    <>
                      <X size={19} className="text-[#D55A70]" />
                      <span className="text-sm font-semibold text-[#D55A70]">
                        Correct:{" "}
                        {
                          currentQuestion.options[
                            currentQuestion.correctIndex
                          ]
                        }
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextQuestion}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] text-sm font-semibold text-white"
                >
                  {questionIndex === quiz.length - 1
                    ? "See Results"
                    : "Next Question"}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Floating Add Button */}
      {quiz.length === 0 && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Add new word"
          className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#7054E8] text-white shadow-[0_8px_28px_rgba(112,84,232,0.35)] transition active:scale-95 sm:right-8"
        >
          <Plus size={26} />
        </button>
      )}

      <AddWordSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lessons={allLessons}
        selectedLesson={null}
        onAdd={handleAddWord}
        onCreateLesson={handleCreateLesson}
      />
    </>
  );
}
