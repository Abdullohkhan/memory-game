import { DIFFICULTIES, formatTime, type BestScores, type GameState } from "@memory/core";
import type { T } from "../hooks/useSettings";

interface Props {
  state: GameState;
  best: BestScores;
  t: T;
}

export function Stats({ state, best, t }: Props) {
  const { moveLimit, timeLimit } = DIFFICULTIES[state.difficulty];
  const lowTime = state.status === "playing" && state.timeLeft <= 10;
  const items = [
    { label: t("moves"), value: `${state.moves}/${moveLimit}`, warn: moveLimit - state.moves <= 3 && state.status === "playing" },
    { label: t("time"), value: formatTime(state.timeLeft), warn: lowTime },
    { label: t("points"), value: String(state.matched.length * 100) },
    { label: t("best"), value: String(best[state.difficulty] ?? 0) },
  ];
  return (
    <>
      <dl className="stats">
        {items.map((it) => (
          <div key={it.label} className={`stat${it.warn ? " is-warn" : ""}`}>
            <dt>{it.label}</dt>
            <dd>{it.value}</dd>
          </div>
        ))}
      </dl>
      <div className="progress" role="progressbar" aria-label={t("time")} aria-valuemin={0} aria-valuemax={timeLimit} aria-valuenow={state.timeLeft}>
        <div className="progress-bar" style={{ width: `${(state.timeLeft / timeLimit) * 100}%` }} />
      </div>
    </>
  );
}
