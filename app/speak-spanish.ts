const spanishLocale = "es-ES";

export function speakSpanish(text: string) {
  if (!("speechSynthesis" in window)) return;

  const synthesis = window.speechSynthesis;
  const voices = synthesis.getVoices();
  const spanishVoices = voices.filter((voice) => /^es(?:-|$)/i.test(voice.lang));
  const voice =
    spanishVoices.find((voice) => voice.lang.toLowerCase() === spanishLocale.toLowerCase()) ??
    spanishVoices.find((voice) => voice.default) ??
    spanishVoices[0];

  const utterance = new SpeechSynthesisUtterance(text.split(" / ")[0]);
  utterance.lang = voice?.lang ?? spanishLocale;
  utterance.voice = voice ?? null;
  utterance.rate = 0.85;

  synthesis.cancel();
  synthesis.speak(utterance);
}
