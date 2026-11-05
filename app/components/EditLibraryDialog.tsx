"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { LibraryEdit } from "../library-data";

export default function EditLibraryDialog({ edit, deleting, onClose, onSave }: {
  edit: LibraryEdit;
  deleting: boolean;
  onClose: () => void;
  onSave: (edit: LibraryEdit) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { if (element?.open) element.close(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    const changes = edit.kind === "word"
      ? { ...edit, spanish: field("spanish"), georgian: field("georgian") }
      : { ...edit, title: field("title") };
    if (!deleting && (changes.kind === "word" ? !changes.spanish || !changes.georgian : !changes.title)) {
      setError("Fill in all fields.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(deleting ? edit : changes);
      onClose();
    } catch {
      setError(deleting ? "Could not delete. Please retry." : "Could not save your changes. Please retry.");
      setSaving(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-[#ECECF2] px-3 py-2 text-base focus:border-[#7054E8] focus:outline-none";
  const item = edit.kind === "word" ? "word" : "lesson";

  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#ECECF2] bg-white p-5 text-[#242435] shadow-xl backdrop:bg-[#1B1B29]/35">
      <form onSubmit={submit} className="space-y-4">
        <h2 id={titleId} className="text-lg font-bold">{deleting ? `Delete ${item}?` : edit.kind === "word" ? "Edit word" : "Rename lesson"}</h2>
        {deleting ? (
          <p className="break-words text-sm leading-6 text-[#626274]">
            Are you sure you want to delete <strong>{edit.kind === "word" ? edit.spanish : edit.title}</strong>?
            {edit.kind === "lesson" && " All words in this lesson will also be deleted."}
          </p>
        ) : edit.kind === "word" ? (
          <>
            <label className="block text-sm font-medium">
              Word
              <input name="spanish" defaultValue={edit.spanish} required maxLength={500} className={inputClass} />
            </label>
            <label className="block text-sm font-medium">
              Translation
              <input name="georgian" defaultValue={edit.georgian} required maxLength={500} className={inputClass} />
            </label>
          </>
        ) : (
          <label className="block text-sm font-medium">
            Lesson name
            <input name="title" defaultValue={edit.title} required maxLength={200} className={inputClass} />
          </label>
        )}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#626274]">Cancel</button>
          <button disabled={saving} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${deleting ? "bg-red-700" : "bg-[#7054E8]"}`}>
            {deleting ? saving ? "Deleting…" : "Delete" : saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
