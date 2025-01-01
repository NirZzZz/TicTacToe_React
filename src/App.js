import { useState } from "react";
import axios from "axios";

function Square({ value, onSquareClick, isWinningSquare }) {
  return (
    <button
      className={`square ${isWinningSquare ? "winning-square" : ""}`}
      onClick={onSquareClick}
    >
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay, move, playerX, playerO, handleEndGame }) {
  const winnerInfo = calculateWinner(squares);
  const winner = winnerInfo ? winnerInfo.winner : null;
  const winningSquares = winnerInfo ? winnerInfo.line : [];

  let status;
  if (winner) {
    status = "Winner: " + winner;
    // Call handleEndGame when game is finished
    handleEndGame(winner);
  } else if (squares.every(Boolean)) {
    status = "It's a draw!";
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O") + ", You are at move #" + (move + 1);
  }

  function handleClick(i) {
    if (squares[i] || winner) {
      return;
    }
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }

  const boardSize = 3;
  const rows = [];
  for (let row = 0; row < boardSize; row++) {
    const cols = [];
    for (let col = 0; col < boardSize; col++) {
      const index = row * boardSize + col;
      cols.push(
        <Square
          key={index}
          value={squares[index]}
          onSquareClick={() => handleClick(index)}
          isWinningSquare={winningSquares.includes(index)}
        />
      );
    }
    rows.push(
      <div key={row} className="board-row">
        {cols}
      </div>
    );
  }

  return (
    <>
      <div className="status">{status}</div>
      {rows}
    </>
  );
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [sortOrder, setSortOrder] = useState("asc");
  const [playerX, setPlayerX] = useState("");
  const [playerO, setPlayerO] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  function toggleSortOrder() {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  }

  const sortedMoves = [...history.keys()].sort((a, b) =>
    sortOrder === "asc" ? a - b : b - a
  );

  const moves = sortedMoves.map((move) => {
    const description = move > 0 ? `Go to move #${move}` : "Go to game start";
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  const handleStartGame = () => {
    if (playerX && playerO) {
      setGameStarted(true);
      axios.post("http://localhost:5000/start_game", {
        player_x: playerX,
        player_o: playerO,
      })
      .catch(error => {
        console.error("Error starting the game:", error);
      });
    } else {
      alert("Please enter both players' names!");
    }
  };

  // Updated handleEndGame to send winner and loser to backend
  const handleEndGame = (winner) => {
    if (winner) {
      const winnerName = winner === "X" ? playerX : playerO;
      const loserName = winner === "X" ? playerO : playerX;
      axios.post("http://localhost:5000/start_game", {
        player_x: playerX,
        player_o: playerO,
        winner: winnerName,
        loser: loserName,
      })
      .catch(error => {
        console.error("Error updating scores:", error);
      });
    }
  };

  if (!gameStarted) {
    return (
      <div>
        <h2>Who's gonna play the X today?</h2>
        <input
          type="text"
          value={playerX}
          onChange={(e) => setPlayerX(e.target.value)}
          placeholder="Enter X player name"
        />
        <h2>And for the O, what's your name buddy?</h2>
        <input
          type="text"
          value={playerO}
          onChange={(e) => setPlayerO(e.target.value)}
          placeholder="Enter O player name"
        />
        <button onClick={handleStartGame}>Start Game</button>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="game-board">
        <Board
          xIsNext={xIsNext}
          squares={currentSquares}
          onPlay={handlePlay}
          move={currentMove}
          playerX={playerX}   // Passing playerX as a prop to Board
          playerO={playerO}   // Passing playerO as a prop to Board
          handleEndGame={handleEndGame}  // Passing handleEndGame function to Board
        />
      </div>
      <div className="game-info">
        <button onClick={toggleSortOrder}>
          Sort {sortOrder === "asc" ? "Descending" : "Ascending"}
        </button>
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}