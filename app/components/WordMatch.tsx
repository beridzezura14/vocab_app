import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import type { Word } from "@/data/words";
import { shuffle } from "../shuffle";
import { ProfileContext, SaveSpeedRoundContext } from "./AccountContext";

type Side = "spanish" | "georgian";
type Selection = { side: Side; id: number };

export type MatchSession = {
  words: Word[];
  translations: Word[];
  selected: Selection | null;
  matched: number[];
  feedback: "correct" | "incorrect" | null;
  speed?: { deadline: number; score: number };
};

export function matchCandidates(words: Word[]) {
  const spanish = new Set<string>();
  const georgian = new Set<string>();
  return words.filter((word) => {
    const left = word.spanish.trim().normalize("NFC").toLowerCase();
    const right = word.georgian.trim().normalize("NFC").toLowerCase();
    if (!left || !right || spanish.has(left) || georgian.has(right)) return false;
    spanish.add(left);
    georgian.add(right);
    return true;
  });
}

export function makeMatch(words: Word[]): MatchSession {
  const selected = shuffle(words).slice(0, 6);
  return { words: selected, translations: shuffle(selected), selected: null, matched: [], feedback: null };
}

function timeIsUp(deadline: number | undefined) {
  return deadline !== undefined && Date.now() >= deadline;
}

export default function WordMatch({ session, onChange, onExit, onRestart, nextBoard }: {
  session: MatchSession;
  onChange: (session: MatchSession) => void;
  onExit: () => void;
  onRestart: () => void;
  nextBoard: () => MatchSession;
}) {
  const deadline = session.speed?.deadline;
  const [clock, setClock] = useState<{ deadline: number; seconds: number } | null>(null);
  const remaining = clock?.deadline === deadline ? clock?.seconds : undefined;
  const expired = deadline !== undefined && remaining === 0;
  const complete = expired || (!session.speed && session.matched.length === session.words.length);
  const { speedRoundBest = 0 } = useContext(ProfileContext);
  const saveSpeedRound = useContext(SaveSpeedRoundContext);
  const finishedScore = expired ? session.speed?.score : undefined;
  const [failedDeadline, setFailedDeadline] = useState<number>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (finishedScore === undefined || finishedScore <= speedRoundBest) return;
    let active = true;
    void saveSpeedRound(finishedScore).catch(() => {
      if (active) setFailedDeadline(deadline);
    });
    return () => { active = false; };
  }, [attempt, deadline, finishedScore, saveSpeedRound, speedRoundBest]);

  useEffect(() => {
    if (deadline === undefined) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setClock((previous) => previous?.deadline === deadline && previous.seconds === seconds ? previous : { deadline, seconds });
    };
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 200);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [deadline]);

  function select(side: Side, id: number) {
    if (timeIsUp(deadline) || session.matched.includes(id)) return;
    if (!session.selected || session.selected.side === side) {
      const selected = session.selected?.id === id && session.selected.side === side ? null : { side, id };
      onChange({ ...session, selected, feedback: null });
      return;
    }
    const correct = session.selected.id === id;
    const matched = correct ? [...session.matched, id] : session.matched;
    const speed = session.speed && correct ? { ...session.speed, score: session.speed.score + 1 } : session.speed;
    if (speed && matched.length === session.words.length) {
      onChange({ ...nextBoard(), speed, feedback: "correct" });
      return;
    }
    onChange({
      ...session,
      selected: null,
      matched,
      feedback: correct ? "correct" : "incorrect",
      speed,
    });
  }

  const columns: { side: Side; label: string; words: Word[] }[] = [
    { side: "spanish", label: "Spanish", words: session.words },
    { side: "georgian", label: "Georgian", words: session.translations },
  ];

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="flex items-center gap-2 text-sm font-medium text-[#626274]">
          <ArrowLeft size={18} /> {session.speed ? "Exit Speed Round" : "Exit Match"}
        </button>
        <span className="rounded-full bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#6245D4]">
          {session.speed ? `${remaining ?? "—"}s · ${session.speed.score} matched` : `${session.matched.length} / ${session.words.length} matched`}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-[#242435]">{session.speed ? "Speed Round" : "Match Words"}</h1>
      <p className="mb-4 mt-1 text-sm text-[#626274]">Tap a word and its translation to make a pair.</p>
      {!expired && <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {columns.map(({ side, label, words }) => (
          <div key={side} className="grid min-w-0 grid-rows-subgrid gap-2"
            style={{ gridRow: `span ${words.length + 1}` }}>
            <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-[#626274]">{label}</h2>
            {words.map((word) => {
              const pair = session.matched.indexOf(word.id);
              const selected = session.selected?.side === side && session.selected.id === word.id;
              const colors = pair >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : selected ? "border-[#7054E8] bg-[#F0EBFF] text-[#5038B9]"
                  : "border-[#ECECF2] bg-white text-[#242435] hover:border-[#D8CFFF]";
              return (
                <button key={word.id} type="button" disabled={pair >= 0}
                  aria-pressed={selected || pair >= 0} onClick={() => select(side, word.id)}
                  className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-center text-sm font-semibold ${colors}`}>
                  <span className="min-w-0 wrap-anywhere">{word[side]}</span>
                  {pair >= 0 && <span className="shrink-0 text-xs" aria-label={`Matched pair ${pair + 1}`}><Check size={14} aria-hidden="true" />{pair + 1}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>}
      <p role="status" className={`mt-3 min-h-6 text-center text-sm font-semibold ${session.feedback === "incorrect" ? "text-red-700" : "text-emerald-700"}`}>
        {expired ? `Time’s up! ${session.speed?.score ?? 0} correct ${session.speed?.score === 1 ? "pair" : "pairs"}.` :
          complete ? "All pairs matched!" : session.feedback === "correct" ? "Correct match!" :
          session.feedback === "incorrect" ? "That pair doesn’t match. Try again." : ""}
      </p>
      {expired && (
        <p className="mt-1 text-center text-sm text-[#626274]">Personal best: {speedRoundBest}</p>
      )}
      {expired && failedDeadline === deadline && finishedScore !== undefined && finishedScore > speedRoundBest && (
        <div className="mt-2 text-center text-sm text-red-700" role="status">
          Could not save your best score.{" "}
          <button type="button" className="font-semibold underline"
            onClick={() => { setFailedDeadline(undefined); setAttempt((previous) => previous + 1); }}>
            Retry
          </button>
        </div>
      )}
      {complete && (
        <button type="button" onClick={onRestart} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7054E8] px-4 text-sm font-semibold text-white">
          <RotateCcw size={17} /> Play Again
        </button>
      )}
    </section>
  );
}
