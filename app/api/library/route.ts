import { currentAccount, sameOrigin } from "../../account";
import { database } from "../../database";
import { parseLibrary, type Library } from "../../library-data";

const libraries = () => database().collection<Library & { _id: string }>("personal_libraries");

export async function GET() {
  try {
    const username = await currentAccount();
    if (!username) return new Response(null, { status: 401 });
    return Response.json(parseLibrary(await libraries().findOne({ _id: username })), {
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

    const { words, lessons } = parseLibrary(await request.json().catch(() => null));
    if (words.length !== 1 || lessons.length > 1) return new Response(null, { status: 400 });
    const [word] = words;
    const [lesson] = lessons;
    if (!word.spanish.trim() || !word.georgian.trim() ||
        word.spanish.length > 500 || word.georgian.length > 500 ||
        (lesson && (lesson.id !== word.lessonId || !lesson.title.trim() || lesson.title.length > 200))) {
      return new Response(null, { status: 400 });
    }
    const library = await libraries().findOneAndUpdate(
      lesson ? { _id: username } : { _id: username, "lessons.id": word.lessonId },
      { $addToSet: { words: word, lessons: { $each: lessons } } },
      { upsert: Boolean(lesson), returnDocument: "after" }
    );
    if (!library) return new Response(null, { status: 400 });
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
