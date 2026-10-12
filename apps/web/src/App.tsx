import { useEffect, useState } from "react";
import { DIFFICULTY_LIST, type Difficulty } from "@memory/core";
import { AccountDialog } from "./components/AccountDialog";
import { Board } from "./components/Board";
import { LeaderboardDialog } from "./components/LeaderboardDialog";
import { Modal } from "./components/Modal";
import { Settings } from "./components/Settings";
import { Stats } from "./components/Stats";
import { useAccount } from "./hooks/useAccount";
import { useGame } from "./hooks/useGame";
import { useSettings } from "./hooks/useSettings";

export function App() {
  const { settings, update, t } = useSettings();
  const { state, best, newRecord, flip, newGame, mergeBest, pause, resume } = useGame(settings.sound);
  const account = useAccount({ settings, onSettings: update, onBest: mergeBest });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  const { submitScore } = account;
  useEffect(() => {
    if (state.status === "won") void submitScore(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the transition to "won"
  }, [state.status]);

  const finished = state.status === "won" || state.status === "lost";
  const canPause = state.status === "playing";

  return (
    <div className="app">
      <header className="topbar">
        <h1>{t("title")}</h1>
        <div className="topbar-actions">
          {account.enabled && (
            <>
              <button type="button" className="icon-btn" onClick={() => setBoardOpen(true)} aria-label={t("leaderboard")}>
                🏆
              </button>
              <button type="button" className={`icon-btn${account.user ? " is-signed-in" : ""}`} onClick={() => setAccountOpen(true)} aria-label={account.user ? account.user.nickname : t("account")}>
                👤
              </button>
            </>
          )}
          <button type="button" className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label={t("settings")}>
            ⚙
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel" aria-label={t("difficulty")}>
          <div className="segmented" role="group" aria-label={t("difficulty")}>
            {DIFFICULTY_LIST.map((d: Difficulty) => (
              <button key={d} type="button" aria-pressed={state.difficulty === d} onClick={() => newGame(d)}>
                {t(d)}
              </button>
            ))}
          </div>

          <Stats state={state} best={best} t={t} />

          <p className="hint" aria-live="polite">
            {state.status === "idle" ? t("tapToStart") : " "}
          </p>

          <div className="actions">
            <button type="button" className="btn" onClick={() => (state.status === "paused" ? resume() : pause())} disabled={!canPause && state.status !== "paused"}>
              {state.status === "paused" ? t("resume") : t("pause")}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => newGame(state.difficulty)}>
              {t("newGame")}
            </button>
          </div>
        </section>

        <Board state={state} showSymbols={settings.symbols} t={t} onFlip={flip} onResume={resume} />
      </main>

      <footer className="footer">
        {t("createdBy")} <a href="https://t.me/FRONTEND_BUG" target="_blank" rel="noreferrer">Abdulmajid</a>
      </footer>

      <Settings open={settingsOpen} settings={settings} t={t} onChange={update} onClose={() => setSettingsOpen(false)} />

      {account.enabled && (
        <>
          <AccountDialog open={accountOpen} account={account} t={t} onClose={() => setAccountOpen(false)} />
          <LeaderboardDialog open={boardOpen} initial={state.difficulty} userId={account.user?.id} t={t} onClose={() => setBoardOpen(false)} />
        </>
      )}

      <Modal open={finished} label={state.status === "won" ? t("win") : t("lose")}>
        <h2 className={state.status === "won" ? "text-success" : "text-danger"}>{state.status === "won" ? t("win") : t("lose")}</h2>
        {state.status === "won" && (
          <>
            <p className="result-points">
              {t("yourPoints")}: <strong>{state.points}</strong>
            </p>
            {newRecord && <p className="record">🏆 {t("newRecord")}</p>}
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={() => newGame(state.difficulty)} autoFocus>
          {t("playAgain")}
        </button>
      </Modal>
    </div>
  );
}
