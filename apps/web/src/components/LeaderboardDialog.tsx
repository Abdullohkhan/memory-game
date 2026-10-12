import { useEffect, useState } from "react";
import { DIFFICULTY_LIST, type Difficulty, type LeaderboardEntry } from "@memory/core";
import { api } from "../api";
import { errorText } from "../hooks/useAccount";
import type { T } from "../hooks/useSettings";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  initial: Difficulty;
  userId: string | undefined;
  t: T;
  onClose: () => void;
}

export function LeaderboardDialog({ open, initial, userId, t, onClose }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initial);
  const [state, setState] = useState<{ key: string; entries?: LeaderboardEntry[]; error?: string }>({ key: "" });
  const key = open ? difficulty : "";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .leaderboard(difficulty)
      .then((entries) => !cancelled && setState({ key: difficulty, entries }))
      .catch((e) => !cancelled && setState({ key: difficulty, error: errorText(e, t) }));
    return () => {
      cancelled = true;
    };
  }, [open, difficulty, t]);

  const ready = state.key === key;
  return (
    <Modal open={open} onClose={onClose} label={t("leaderboard")}>
      <h2>🏆 {t("leaderboard")}</h2>
      <div className="segmented" role="group" aria-label={t("difficulty")}>
        {DIFFICULTY_LIST.map((d) => (
          <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
            {t(d)}
          </button>
        ))}
      </div>
      {!ready && <p className="hint">{t("loading")}</p>}
      {ready && state.error && <p className="form-error" role="alert">{state.error}</p>}
      {ready && state.entries && state.entries.length === 0 && <p className="hint">{t("noScores")}</p>}
      {ready && state.entries && state.entries.length > 0 && (
        <ol className="leaders">
          {state.entries.map((e) => (
            <li key={e.userId} className={e.userId === userId ? "is-me" : undefined}>
              <span className="leader-rank">{e.rank}</span>
              <span className="leader-name">
                {e.nickname}
                {e.userId === userId && <em> ({t("you")})</em>}
              </span>
              <strong>{e.points}</strong>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className="btn" onClick={onClose}>
        {t("close")}
      </button>
    </Modal>
  );
}
