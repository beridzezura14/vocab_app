import { currentAccount, sameOrigin } from "../../account";
import { MAX_WORDS_PER_BATCH, parseLibrary } from "../../library-data";
import { libraries, readLibrary } from "../../library-store";
import { preparePronunciation } from "../../pronunciation-audio";

export async function GET() {
  try {
    const username = await currentAccount();
    if (!username) return new Response(null, { status: 401 });
    return Response.json(await readLibrary(username), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const username = await currentAccount();
    if (!username) return new Response(null, { status: 401 });

    const body = await request.json().catch(() => null);
    const { words, lessons } = parseLibrary(body);
    if (!words.length || words.length > MAX_WORDS_PER_BATCH || words.length !== body?.words?.length ||
        lessons.length > 1 || (body?.lessons !== undefined && (!Array.isArray(body.lessons) || lessons.length !== body.lessons.length))) {
      return new Response(null, { status: 400 });
    }
    const [word] = words;
    const [lesson] = lessons;
    if (new Set(words.map(({ id }) => id)).size !== words.length ||
        words.some((item) => item.lessonId !== word.lessonId || !item.spanish.trim() || !item.georgian.trim() ||
          item.spanish.length > 500 || item.georgian.length > 500) ||
        (lesson && (lesson.id !== word.lessonId || !lesson.title.trim() || lesson.title.length > 200))) {
      return new Response(null, { status: 400 });
    }
    const library = await libraries().findOneAndUpdate(
      lesson ? { _id: username } : { _id: username, "lessons.id": word.lessonId },
      { $addToSet: { words: { $each: words }, lessons: { $each: lessons } } },
      { upsert: Boolean(lesson), returnDocument: "after" }
    );
    if (!library) return new Response(null, { status: 400 });
    preparePronunciation(username, words.map(({ spanish }) => spanish));
    return Response.json(parseLibrary(library));
  } catch {
    return new Response(null, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const username = await currentAccount();
    if (!username) return new Response(null, { status: 401 });

    const edit = await request.json().catch(() => null);
    if (!Number.isSafeInteger(edit?.id)) return new Response(null, { status: 400 });

    const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
    const filter = { _id: username };
    const options = { returnDocument: "after" as const };
    let library;
    if (edit.kind === "word") {
      const spanish = clean(edit.spanish);
      const georgian = clean(edit.georgian);
      if (!spanish || !georgian || spanish.length > 500 || georgian.length > 500) {
        return new Response(null, { status: 400 });
      }
      library = await libraries().findOneAndUpdate(
        { ...filter, "words.id": edit.id },
        { $set: { "words.$.spanish": spanish, "words.$.georgian": georgian } },
        options
      );
      if (library) preparePronunciation(username, spanish);
    } else if (edit.kind === "lesson") {
      const title = clean(edit.title);
      if (!title || title.length > 200) return new Response(null, { status: 400 });
      library = await libraries().findOneAndUpdate(
        { ...filter, "lessons.id": edit.id },
        { $set: { "lessons.$.title": title } },
        options
      );
    } else {
      return new Response(null, { status: 400 });
    }
    if (!library) return new Response(null, { status: 404 });
    return Response.json(parseLibrary(library));
  } catch {
    return new Response(null, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const username = await currentAccount();
    if (!username) return new Response(null, { status: 401 });

    const target = await request.json().catch(() => null);
    if (!Number.isSafeInteger(target?.id) || (target.kind !== "word" && target.kind !== "lesson")) {
      return new Response(null, { status: 400 });
    }

    const id: number = target.id;
    const library = await libraries().findOneAndUpdate(
      { _id: username },
      { $pull: target.kind === "lesson" ? { lessons: { id }, words: { lessonId: id } } : { words: { id } } },
      { returnDocument: "after" }
    );
    return Response.json(parseLibrary(library));
  } catch {
    return new Response(null, { status: 503 });
  }
}
