import { currentAccount } from "../../../account";
import { database } from "../../../database";
import type { Library } from "../../../library-data";
import { pronunciationAudio } from "../../../pronunciation-audio";

export async function GET(request: Request) {
  try {
    const accountId = await currentAccount();
    if (!accountId) return new Response(null, { status: 401 });
    const rawId = new URL(request.url).searchParams.get("word");
    const id = Number(rawId);
    if (!rawId || !Number.isSafeInteger(id) || id <= 0) return new Response(null, { status: 400 });
    const library = await database().collection<Library & { _id: string }>("personal_libraries")
      .findOne({ _id: accountId, "words.id": id }, { projection: { "words.$": 1 } });
    const word = library?.words[0];
    if (!word) return new Response(null, { status: 404 });
    const audio = await pronunciationAudio(accountId, word.spanish);
    if (!audio) return new Response(null, { status: 503 });

    const headers = new Headers({
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
    });
    const range = request.headers.get("Range");
    if (!range) {
      headers.set("Content-Length", String(audio.length));
      return new Response(audio, { headers });
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : Math.max(0, audio.length - Number(match?.[2]));
    const end = match?.[1] && match[2] ? Math.min(audio.length - 1, Number(match[2])) : audio.length - 1;
    if (!match || (!match[1] && !match[2]) || start > end || !Number.isSafeInteger(start)) {
      headers.set("Content-Range", `bytes */${audio.length}`);
      return new Response(null, { status: 416, headers });
    }
    const chunk = audio.slice(start, end + 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${audio.length}`);
    headers.set("Content-Length", String(chunk.length));
    return new Response(chunk, { status: 206, headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}
