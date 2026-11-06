"use client";

import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SuccessNoticeContext } from "./components/AccountContext";
import { parseLibrary, type Library, type LibraryEdit, type WordPair } from "./library-data";

function useLibraryState(initialLibrary: Library | null) {
  const showNotice = useContext(SuccessNoticeContext);
  const [library, setLibrary] = useState<Library>(() => initialLibrary ?? { words: [], lessons: [] });
  const [libraryError, setLibraryError] = useState("");
  const load = useRef<AbortController | null>(null);
  const pending = useRef<{ key: string; id: number } | null>(null);

  useEffect(() => {
    if (initialLibrary) return;
    const controller = new AbortController();
    load.current = controller;
    fetch("/api/library", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your library.");
        const data = parseLibrary(await response.json());
        if (!controller.signal.aborted) setLibrary(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLibraryError("Could not load your library. Refresh to retry.");
      });
    return () => controller.abort();
  }, [initialLibrary]);

  async function addWords(words: WordPair[], lesson: number | string) {
    const key = JSON.stringify([words, lesson]);
    if (pending.current?.key !== key) {
      const random = crypto.getRandomValues(new Uint16Array(1))[0];
      pending.current = { key, id: Date.now() * 4096 + random % 4000 };
    }
    const { id } = pending.current;
    const lessons = typeof lesson === "string" ? [{ id, title: lesson, description: "" }] : [];
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        words: words.map((word, index) => ({ ...word, id: id + index, lessonId: typeof lesson === "number" ? lesson : id })),
        lessons,
      }),
    });
    if (!response.ok) throw new Error("Could not save this word. Please retry.");
    const saved = parseLibrary(await response.json());
    load.current?.abort();
    pending.current = null;
    setLibrary(saved);
    setLibraryError("");
    const added = words.length === 1 ? "1 word added" : `${words.length} words added`;
    showNotice(typeof lesson === "string" ? `Lesson created. ${added}.` : `${added}.`);
    return typeof lesson === "number" ? lesson : id;
  }

  async function editLibrary(edit: LibraryEdit, deleting = false) {
    const response = await fetch("/api/library", {
      method: deleting ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deleting ? { kind: edit.kind, id: edit.id } : edit),
    });
    if (!response.ok) throw new Error("Could not save your changes. Please retry.");
    const saved = parseLibrary(await response.json());
    load.current?.abort();
    setLibrary(saved);
    setLibraryError("");
    if (deleting) showNotice(edit.kind === "lesson" ? "Lesson deleted." : "Word deleted.");
  }

  return { customWords: library.words, customLessons: library.lessons, addWords, editLibrary, libraryError };
}

const LibraryContext = createContext<ReturnType<typeof useLibraryState> | null>(null);

export function LibraryProvider({ initialLibrary, children }: { initialLibrary: Library | null; children: ReactNode }) {
  const library = useLibraryState(initialLibrary);
  return createElement(LibraryContext.Provider, { value: library }, children);
}

export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("LibraryProvider is missing");
  return library;
}
