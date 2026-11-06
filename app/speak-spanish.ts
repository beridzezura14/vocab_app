import { useContext } from "react";
import { CloudPronunciationContext } from "./components/AccountContext";
import { pronunciationText, recordedPronunciation } from "./pronunciation-text";

const spanishLocale = "es-ES";
let activeRecording: { audio: HTMLAudioElement; url: string; text: string } | null = null;
let playbackRequest = 0;

export function useSpeakSpanish() {
  const cloud = useContext(CloudPronunciationContext);
  return (text: string, wordId: number) => speakSpanish(text, wordId, cloud);
}

function speakSpanish(text: string, wordId: number, cloud: boolean) {
  const request = ++playbackRequest;
  activeRecording?.audio.pause();
  const pronunciation = pronunciationText(text);
  const recordingUrl = recordedPronunciation(text) ?? (cloud ? `/api/library/audio?word=${wordId}` : null);
  if (!recordingUrl) {
    activeRecording = null;
    speakWithBrowser(pronunciation);
    return;
  }

  window.speechSynthesis?.cancel();
  const previous = activeRecording;
  const recording = previous?.url === recordingUrl && previous.text === pronunciation && previous.audio.readyState >= 2
    ? previous.audio
    : new Audio(recordingUrl);
  if (recording === previous?.audio) recording.currentTime = 0;
  activeRecording = { audio: recording, url: recordingUrl, text: pronunciation };
  void recording.play().catch(() => {
    if (request === playbackRequest) {
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
