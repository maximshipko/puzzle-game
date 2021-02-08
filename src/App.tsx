import React from "react";
import "./App.scss";
import picture from "./picture1.jpg";
import { Canvas } from "./Canvas";
import { PieceType } from "./Piece";

type GameState = {
  complexity: number; // number of pieces
  image: string;
  imageSize: [number, number];
  rotatePieces: boolean;
  snapTrasholdPx: number;
};

const initialState: GameState = {
  complexity: 4,
  image: picture,
  imageSize: [400, 400],
  rotatePieces: true,
  snapTrasholdPx: 10,
};

const makePieces = (game: GameState): PieceType[] => {
  const pieces = Array(game.complexity * game.complexity)
    .fill(undefined)
    .map((_, i) => makePiece(game, i));
  const N = game.complexity;
  pieces.forEach((p, i) => {
    const t = pieces[i - N];
    const b = pieces[i + N];
    const r = p.col !== N - 1 ? pieces[i + 1] : undefined;
    const l = p.col !== 0 ? pieces[i - 1] : undefined;
    const tr = t && r ? pieces[i - N + 1] : undefined;
    const tl = t && l ? pieces[i - N - 1] : undefined;
    const br = b && r ? pieces[i + N + 1] : undefined;
    const bl = b && l ? pieces[i + N - 1] : undefined;
    p.neighbors = { t, b, r, l, tr, tl, br, bl };
  });
  return pieces;
};
const makePiece = (game: GameState, index: number): PieceType => {
  const [width, height] = game.imageSize;
  const N = game.complexity;
  const pieceWidth = Math.floor(width / N);
  const pieceHeight = Math.floor(height / N);
  const row = Math.floor(index / N);
  const col = index % N;
  const rotate = game.rotatePieces ? Math.floor(Math.random() * 4) * 90 : 0;
  const position: PieceType["position"] = [
    Math.floor(Math.random() * 800),
    Math.floor(Math.random() * 600),
  ];

  const style: React.CSSProperties = {
    width: pieceWidth,
    height: pieceHeight,
    left: position[0],
    top: position[1],
  };
  const imageStyle: React.CSSProperties = {
    backgroundImage: `url(${game.image})`,
    backgroundPositionX: -col * pieceWidth,
    backgroundPositionY: -row * pieceHeight,
    transform: `rotate(${rotate}deg)`,
  };
  const cornerRadius = 10;
  if (col === 0 && row === 0) imageStyle.borderTopLeftRadius = cornerRadius;
  if (col === N - 1 && row === 0)
    imageStyle.borderTopRightRadius = cornerRadius;
  if (col === 0 && row === N - 1)
    imageStyle.borderBottomLeftRadius = cornerRadius;
  if (col === N - 1 && row === N - 1)
    imageStyle.borderBottomRightRadius = cornerRadius;
  const neighbors = {};

  return {
    index,
    rotate,
    position,
    row,
    col,
    width: pieceWidth,
    height: pieceHeight,
    style,
    imageStyle,
    placed: false,
    completed: false,
    neighbors,
  };
};

const shuffleArray = <T extends unknown>(arr: Array<T>): Array<T> => {
  // https://stackoverflow.com/a/2450976/3519246
  const array = arr.slice();
  let currentIndex = array.length;
  let randomIndex, tmp;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    tmp = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = tmp;
  }
  return array;
};

function App() {
  const [game, setGame] = React.useState(() => initialState);
  const [pieces, setPieces] = React.useState<PieceType[]>(() =>
    makePieces(game)
  );

  React.useEffect(() => {
    const pieces = makePieces(game);
    setPieces(pieces);
  }, [game]);

  return (
    <div className="App">
      <div className="game">
        <Canvas
          pieces={pieces}
          setPieces={setPieces}
          complexity={game.complexity}
          rotatePieces={game.rotatePieces}
          snapTrasholdPx={game.snapTrasholdPx}
        />
      </div>
      <hr />
      <div>
        <h4>Settings</h4>
        <p>
          <input
            type="text"
            value={game.image}
            onChange={(e) => setGame({ ...game, image: e.target.value })}
          />
        </p>
        <p>
          <input
            type="number"
            value={game.complexity}
            min={2}
            max={10}
            onChange={(e) =>
              setGame({
                ...game,
                complexity: parseInt(e.target.value, 10) || 4,
              })
            }
          />
          &times;{game.complexity}pieces
        </p>
        <p>
          <input
            type="number"
            min={0}
            max={10}
            value={game.snapTrasholdPx}
            onChange={(e) =>
              setGame({
                ...game,
                snapTrasholdPx: parseInt(e.target.value) || 0,
              })
            }
          />
          px.
        </p>
        <p>
          <input
            type="checkbox"
            id="rotateCheckbox"
            checked={game.rotatePieces}
            onChange={(e) =>
              setGame({ ...game, rotatePieces: e.target.checked })
            }
          />
          <label htmlFor="rotateCheckbox">&nbsp;rotate pieces</label>
        </p>
      </div>
    </div>
  );
}

export default App;
