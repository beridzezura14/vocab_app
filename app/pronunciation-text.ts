import { words } from "@/data/words";

export function pronunciationText(text: string) {
  return text.split(" / ")[0].trim().normalize("NFC");
}

const recordings = new Map<string, string>();
for (const word of words) {
  const key = pronunciationText(word.spanish).toLowerCase();
  if (!recordings.has(key)) recordings.set(key, `/audio/lesson-${word.lessonId}/${word.id}.wav`);
}

export function recordedPronunciation(text: string) {
  return recordings.get(pronunciationText(text).toLowerCase());
}
