"use client";

import { useEffect, useRef, useState } from "react";
import { parseLibrary, type Library, type LibraryEdit } from "./library-data";

export function useLibrary() {
  const [library, setLibrary] = useState<Library>({ words: [], lessons: [] });
  const [libraryError, setLibraryError] = useState("");
  const load = useRef<AbortController | null>(null);
  const pending = useRef<{ key: string; id: number } | null>(null);

  useEffect(() => {
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
  }, []);

  async function addWord(spanish: string, georgian: string, lesson: number | string) {
    const key = JSON.stringify([spanish, georgian, lesson]);
    if (pending.current?.key !== key) {
      const random = crypto.getRandomValues(new Uint16Array(1))[0];
      pending.current = { key, id: Date.now() * 1024 + random % 1024 };
    }
    const { id } = pending.current;
    const lessons = typeof lesson === "string" ? [{ id, title: lesson, description: "" }] : [];
    const response = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        words: [{ id, spanish, georgian, lessonId: typeof lesson === "number" ? lesson : id }],
        lessons,
      }),
    });
    if (!response.ok) throw new Error("Could not save this word. Please retry.");
    const saved = parseLibrary(await response.json());
    load.current?.abort();
    pending.current = null;
    setLibrary(saved);
    setLibraryError("");
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
  }

  return { customWords: library.words, customLessons: library.lessons, addWord, editLibrary, libraryError };
}
