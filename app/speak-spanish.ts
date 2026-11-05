import { words } from "@/data/words";

const spanishLocale = "es-ES";
const recordedWords = new Map(
  words
    .filter((word) => word.lessonId === 1 && word.id <= 15)
    .map((word) => [pronunciationText(word.spanish), word.id])
);
let activeRecording: HTMLAudioElement | null = null;

function pronunciationText(text: string) {
  return text.split(" / ")[0];
}

export function speakSpanish(text: string) {
  activeRecording?.pause();
  activeRecording = null;

  const pronunciation = pronunciationText(text);
  const recordingId = recordedWords.get(pronunciation);
  if (recordingId === undefined) {
    speakWithBrowser(pronunciation);
    return;
  }

  window.speechSynthesis?.cancel();
  const recording = new Audio(`/audio/lesson-1/${recordingId}.wav`);
  activeRecording = recording;
  void recording.play().catch(() => {
    if (activeRecording === recording) {
      activeRecording = null;
      speakWithBrowser(pronunciation);
    }
  });
}

function speakWithBrowser(text: string) {
  if (!("speechSynthesis" in window)) return;

  const synthesis = window.speechSynthesis;
  const voices = synthesis.getVoices();
  const spanishVoices = voices.filter((voice) => /^es(?:-|$)/i.test(voice.lang));
  const voice =
    spanishVoices.find((voice) => voice.lang.toLowerCase() === spanishLocale.toLowerCase()) ??
    spanishVoices.find((voice) => voice.default) ??
    spanishVoices[0];

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? spanishLocale;
  utterance.voice = voice ?? null;
  utterance.rate = 0.85;

  synthesis.cancel();
  synthesis.speak(utterance);
}
