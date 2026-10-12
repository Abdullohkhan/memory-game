import { DIFFICULTIES, isCardFaceUp, type GameState } from "@memory/core";
import type { T } from "../hooks/useSettings";
import { Card } from "./Card";

interface Props {
  state: GameState;
  showSymbols: boolean;
  t: T;
  onFlip: (index: number) => void;
  onResume: () => void;
}

export function Board({ state, showSymbols, t, onFlip, onResume }: Props) {
  const cols = DIFFICULTIES[state.difficulty].columns;
  const count = state.deck.length;
  const paused = state.status === "paused";
  const locked = state.resolving || state.status === "won" || state.status === "lost" || paused;

  return (
    <div
      className="board-wrap"
      style={
        {
          "--cols-portrait": cols.portrait,
          "--cols-landscape": cols.landscape,
          "--rows-landscape": Math.ceil(count / cols.landscape),
        } as React.CSSProperties
      }
    >
      <div
        className="board"
        role="group"
        aria-label={t("title")}
        aria-hidden={paused}
      >
        {state.deck.map((card, index) => {
          const faceUp = isCardFaceUp(state, index);
          const matched = state.matched.includes(card.pairId);
          const status = faceUp ? (matched ? t("matchedCard") : card.symbol) : t("faceDown");
          return (
            <Card
              key={card.id}
              card={card}
              index={index}
              faceUp={faceUp}
              matched={matched}
              showSymbol={showSymbols}
              disabled={locked}
              label={`${t("card")} ${index + 1}: ${status}`}
              onFlip={onFlip}
            />
          );
        })}
      </div>
      {paused && (
        <button type="button" className="board-pause" onClick={onResume}>
          <span className="board-pause-title">⏸ {t("paused")}</span>
          <span>{t("resume")}</span>
        </button>
      )}
    </div>
  );
}
