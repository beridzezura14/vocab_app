import type { Word } from "@/data/words";

export type Lesson = { id: number; title: string; description: string };
export type Library = { words: Word[]; lessons: Lesson[] };
export type LibraryEdit =
  | { kind: "word"; id: number; spanish: string; georgian: string }
  | { kind: "lesson"; id: number; title: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseLibrary(value: unknown): Library {
  const data = isRecord(value) ? value : {};
  const words = Array.isArray(data.words) ? data.words : [];
  const lessons = Array.isArray(data.lessons) ? data.lessons : [];
  return {
    words: words.filter((item): item is Word =>
      isRecord(item) && typeof item.id === "number" && Number.isSafeInteger(item.id) &&
      typeof item.spanish === "string" && typeof item.georgian === "string"
    ).map(({ id, spanish, georgian, lessonId }) => ({
      id, spanish, georgian, lessonId: Number.isSafeInteger(lessonId) ? lessonId : 1,
    })),
    lessons: lessons.filter((item): item is Lesson =>
      isRecord(item) && typeof item.id === "number" && Number.isSafeInteger(item.id) &&
      typeof item.title === "string" && typeof item.description === "string"
    ).map(({ id, title, description }) => ({
      id,
      title,
      description: description === "Custom lesson" ? "" : description,
    })),
  };
}
