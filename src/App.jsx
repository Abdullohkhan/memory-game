import React, { useReducer, useEffect, useState } from "react";

const generateDeck = (pairs) => {
  const colors = [ "#FF6347", "#4682B4", "#32CD32", "#FFD700", "#FF69B4", "#8A2BE2", "#00CED1", "#FFA500", "#A52A2A", "#7FFF00", ];
  const deck = [];
  for (let i = 0; i < pairs; i++) {
    deck.push({ color: colors[i], matched: false });
    deck.push({ color: colors[i], matched: false });
  }
  return deck.sort(() => Math.random() - 0.5);
};

const initialState = (pairs) => ({
  deck: generateDeck(pairs),
  flipped: [],
  matched: [],
  turns: 0,
  score: 0,
  pendingReset: false,
  gameOver: false,
});

const gameReducer = (state, action) => {
  switch (action.type) {
    case "FLIP_CARD":
      if (state.flipped.length < 2 && !state.flipped.includes(action.index) &&
          !state.matched.includes(state.deck[action.index].color)) {
        return { ...state, flipped: [...state.flipped, action.index] };
      }
      return state;
    case "CHECK_MATCH": {
      const [first, second] = state.flipped;
      if (state.deck[first].color === state.deck[second].color) {
        const newMatched = [...state.matched, state.deck[first].color];
        const isGameOver = newMatched.length === state.deck.length / 2;
        return { ...state,
          matched: newMatched,
          score: state.score + 1, // ✅ har bir juftlik uchun ball qo‘shiladi
          flipped: [],
          pendingReset: false,
          gameOver: isGameOver,
        };
      } else {
        return { ...state, pendingReset: true };
      }
    }
    case "RESET_FLIPPED":
      return { ...state, flipped: [], pendingReset: false };
    case "INCREMENT_TURN":
      return { ...state, turns: state.turns + 1 };
    case "RESET_GAME":
      return {...initialState(action.pairs), };
    default:
      return state;
  }
};

export const App = () => {
  const [difficulty, setDifficulty] = useState("Easy");
  const [timeLeft, setTimeLeft] = useState(60);
  const [bestScore, setBestScore] = useState(
    localStorage.getItem("bestScore") || 0
  );

  const pairs = difficulty === "Easy" ? 6 : difficulty === "Medium" ? 8 : 10;
  const turnLimit = difficulty === "Easy" ? 20 : difficulty === "Medium" ? 15 : 12;

  const [state, dispatch] = useReducer(gameReducer, initialState(pairs));

  useEffect(() => {
    if (state.flipped.length === 2) {
      dispatch({ type: "CHECK_MATCH" });
      dispatch({ type: "INCREMENT_TURN" });
    }
  }, [state.flipped]);

  useEffect(() => {
    if (state.pendingReset) {
      const timer = setTimeout(() => {
        dispatch({ type: "RESET_FLIPPED" });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.pendingReset]);

  useEffect(() => {
    if (!state.gameOver && state.turns < turnLimit && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.gameOver, state.turns, timeLeft, turnLimit]);

  useEffect(() => {
    if (state.gameOver) {
      if (state.score > bestScore) {
        localStorage.setItem("bestScore", state.score);
        setBestScore(state.score);
      }
    }
  }, [state.gameOver, state.score, bestScore]);

  const handleCardClick = (index) => {
    if (!state.gameOver && state.flipped.length < 2 && !state.flipped.includes(index))
      { dispatch({ type: "FLIP_CARD", index }); }
  };

  const handlePlayAgain = () => {
    setTimeLeft(60);
    dispatch({ type: "RESET_GAME", pairs });
  };

  return (
    <div className="App">
      <h1>Memory Game</h1>
      <h1 className="creator">Created At: <a href="https://t.me/FRONTEND_BUG">Abdulmajid</a></h1>
      <div className="controls">
        <label>Difficulty: </label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>
      <div className="info">
        <p>Score: {state.score}</p>
        <p>Turn: {state.turns}/{turnLimit}</p>
        <p>Time: {timeLeft}s</p>
        <p>Best Score: {bestScore}</p>
      </div>
      <div className="deck">
        {state.deck.map((card, index) => (
          <div key={index} style={{ "--card-color": card.color }}
            className={`card ${ state.flipped.includes(index) ||
              state.matched.includes(card.color) ? "flipped show" : "" }`}
            onClick={() => handleCardClick(index)} />
        ))}
      </div>
      {/* Win */}
      {state.gameOver && (
        <>
          <div className="overlay" />
          <div className="game-over">
            <h2>You Win!</h2>
            <button onClick={handlePlayAgain}>Play Again</button>
          </div>
        </>
      )}
      {/* Lose */}
      {!state.gameOver && (state.turns >= turnLimit || timeLeft <= 0) && (
        <>
          <div className="overlay" />
          <div className="game-over">
            <h2>Game Over!</h2>
            <button onClick={handlePlayAgain}>Try Again</button>
          </div>
        </>
      )}
    </div>
  )};