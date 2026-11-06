import { accounts, currentAccount, sameOrigin } from "../../../account";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });

  try {
    const accountId = await currentAccount();
    if (!accountId) return new Response(null, { status: 401 });

    const body = await request.json().catch(() => null);
    const score = body?.score;
    if (typeof score !== "number" || !Number.isSafeInteger(score) || score < 0) {
      return new Response(null, { status: 400 });
    }

    const account = await accounts().findOneAndUpdate(
      { _id: accountId },
      { $max: { speedRoundBest: score } },
      { projection: { speedRoundBest: 1 }, returnDocument: "after" },
    );
    if (!account) return new Response(null, { status: 404 });
    return Response.json({ best: account.speedRoundBest });
  } catch {
    return new Response(null, { status: 503 });
  }
}
