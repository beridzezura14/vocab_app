import { useContext } from "react";
import { CloudPronunciationContext } from "./components/AccountContext";
import { pronunciationText, recordedPronunciation } from "./pronunciation-text";

const spanishLocale = "es-ES";
let activeRecording: HTMLAudioElement | null = null;

export function useSpeakSpanish() {
  const cloud = useContext(CloudPronunciationContext);
  return (text: string, wordId: number) => speakSpanish(text, wordId, cloud);
}

function speakSpanish(text: string, wordId: number, cloud: boolean) {
  activeRecording?.pause();
  activeRecording = null;

  const pronunciation = pronunciationText(text);
  const recordingUrl = recordedPronunciation(text) ?? (cloud ? `/api/library/audio?word=${wordId}` : null);
  if (!recordingUrl) {
    speakWithBrowser(pronunciation);
    return;
  }

  window.speechSynthesis?.cancel();
  const recording = new Audio(recordingUrl);
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
