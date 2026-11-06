import { createHash } from "node:crypto";
import { after } from "next/server";
import { database } from "./database";
import { pronunciationText, recordedPronunciation } from "./pronunciation-text";

const azureVoice = "es-ES-ElviraNeural";
const elevenModel = "eleven_flash_v2_5";
const pending = new Map<string, Promise<Uint8Array<ArrayBuffer> | null>>();

export function cloudPronunciationEnabled() {
  return Boolean(speechProvider());
}

function speechProvider() {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const elevenVoice = process.env.ELEVENLABS_VOICE_ID;
  if (elevenKey && elevenVoice && /^[A-Za-z0-9]+$/.test(elevenVoice)) {
    return { kind: "elevenlabs" as const, key: elevenKey, voice: elevenVoice };
  }
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (key && region && /^[a-z0-9]+$/.test(region)) return { kind: "azure" as const, key, region };
  return null;
}

export function preparePronunciation(accountId: string, text: string | string[]) {
  if (!cloudPronunciationEnabled()) return;
  const words = [...new Set(Array.isArray(text) ? text : [text])].filter((word) => !recordedPronunciation(word));
  if (!words.length) return;
  after(async () => {
    for (let index = 0; index < words.length; index += 5) {
      const results = await Promise.allSettled(words.slice(index, index + 5).map((word) => pronunciationAudio(accountId, word)));
      if (results.some((result) => result.status === "rejected")) console.error("Could not prepare pronunciation audio.");
    }
  });
}

export async function pronunciationAudio(accountId: string, text: string) {
  const pronunciation = pronunciationText(text);
  if (!pronunciation || pronunciation.length > 500) return null;
  const provider = speechProvider();
  if (!provider) return null;
  const voice = provider.kind === "elevenlabs" ? `elevenlabs:${elevenModel}:${provider.voice}` : azureVoice;
  const id = createHash("sha256").update(JSON.stringify([accountId, voice, pronunciation])).digest("hex");
  const existing = pending.get(id);
  if (existing) return existing;
  const audio = loadOrGenerate(id, pronunciation, provider).finally(() => pending.delete(id));
  pending.set(id, audio);
  return audio;
}

async function loadOrGenerate(id: string, text: string, provider: NonNullable<ReturnType<typeof speechProvider>>) {
  const clips = database().collection<{ _id: string; mp3: string }>("pronunciation_audio");
  const cached = await clips.findOne({ _id: id });
  if (cached) return Uint8Array.from(Buffer.from(cached.mp3, "base64"));

  const response = provider.kind === "elevenlabs"
    ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${provider.voice}?output_format=mp3_22050_32`, {
        method: "POST",
        headers: { "xi-api-key": provider.key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: elevenModel, language_code: "es", voice_settings: { speed: 0.85 } }),
        signal: AbortSignal.timeout(12_000),
      })
    : await synthesizeWithAzure(text, provider.key, provider.region);
  if (!response.ok) throw new Error(`Speech synthesis returned HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 1_000_000) throw new Error("Unexpected audio size");
  const clip = await clips.findOneAndUpdate(
    { _id: id },
    { $setOnInsert: { mp3: Buffer.from(bytes).toString("base64") } },
    { upsert: true, returnDocument: "after" },
  );
  return clip ? Uint8Array.from(Buffer.from(clip.mp3, "base64")) : null;
}

function synthesizeWithAzure(text: string, key: string, region: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "Lingua",
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-ES"><voice name="${azureVoice}"><prosody rate="-15%">${escaped}</prosody></voice></speak>`,
    signal: AbortSignal.timeout(12_000),
  });
}
