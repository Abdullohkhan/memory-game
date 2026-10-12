import { memo } from "react";
import type { Card as CardData } from "@memory/core";

interface Props {
  card: CardData;
  index: number;
  faceUp: boolean;
  matched: boolean;
  showSymbol: boolean;
  disabled: boolean;
  label: string;
  onFlip: (index: number) => void;
}

export const Card = memo(function Card({ card, index, faceUp, matched, showSymbol, disabled, label, onFlip }: Props) {
  return (
    <button
      type="button"
      className={`card${faceUp ? " is-up" : ""}${matched ? " is-matched" : ""}`}
      style={{ "--card-color": card.color } as React.CSSProperties}
      onClick={() => onFlip(index)}
      disabled={disabled || faceUp}
      aria-label={label}
    >
      <span className="card-inner">
        <span className="card-face card-back" aria-hidden="true" />
        <span className="card-face card-front" aria-hidden="true">
          {showSymbol && <span className="card-symbol">{card.symbol}</span>}
        </span>
      </span>
    </button>
  );
});
