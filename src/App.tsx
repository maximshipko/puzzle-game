import React from "react";
import "./App.scss";
import picture from "./picture1.jpg";

type GameState = {
  complexity: 2 | 4 | 8 | 16;
  image: string;
  imageSize: [number, number];
  rotatePieces: boolean;
  snapTrasholdPx: number;
};
type Piece = {
  index: number;
  rotate: number; // 0 | 90 | 180 | 270;
  position: [number, number];
  row: number;
  col: number;
  width: number;
  height: number;
  style: React.CSSProperties; // rendom part
  done: boolean;
  neighbors: {
    [key in "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br"]?: Piece;
  };
};
const initialState: GameState = {
  complexity: 4,
  image: picture,
  imageSize: [400, 400],
  rotatePieces: true,
  snapTrasholdPx: 10,
};

const makePieces = (game: GameState): Piece[] => {
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
const makePiece = (game: GameState, index: number): Piece => {
  const [width, height] = game.imageSize;
  const N = game.complexity;
  const pieceWidth = Math.floor(width / N);
  const pieceHeight = Math.floor(height / N);
  const row = Math.floor(index / N);
  const col = index % N;
  const rotate = game.rotatePieces ? Math.floor(Math.random() * 4) * 90 : 0;
  const position: Piece["position"] = [
    Math.floor(Math.random() * 800),
    Math.floor(Math.random() * 600),
  ];

  const style: React.CSSProperties = {
    width: pieceWidth,
    height: pieceHeight,
    backgroundImage: `url(${game.image})`,
    backgroundPositionX: -col * pieceWidth,
    backgroundPositionY: -row * pieceHeight,
    transform: `rotate(${rotate}deg)`,
    position: "absolute",
    left: position[0],
    top: position[1],
  };
  const cornerRadius = 10;
  if (col === 0 && row === 0) style.borderTopLeftRadius = cornerRadius;
  if (col === N - 1 && row === 0) style.borderTopRightRadius = cornerRadius;
  if (col === 0 && row === N - 1) style.borderBottomLeftRadius = cornerRadius;
  if (col === N - 1 && row === N - 1)
    style.borderBottomRightRadius = cornerRadius;
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
    done: false,
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
  const [pieces, setPieces] = React.useState<Piece[] | null>(null);
  const draggableZone = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const pieces = makePieces(game);
    console.log(pieces);
    const shuffledPieces = shuffleArray(pieces);
    setPieces(shuffledPieces);
  }, [game]);

  const rotatePiece = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (game.rotatePieces && pieces && target.classList.contains("piece")) {
      const index = parseInt(target.getAttribute("data-piece-index") || "", 10);
      const piece = pieces.find((p) => p.index === index);
      if (piece) {
        piece.rotate += 90;
        piece.style = {
          ...piece.style,
          transform: `rotate(${piece.rotate}deg)`,
        };
        const validatedPieces = validatePieces(pieces, game.complexity);
        setPieces([...validatedPieces]);
      }
    }
  };

  const dragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    console.log("Drag START", e);
    const index = parseInt(target.getAttribute("data-piece-index") || "", 10);
    draggableZone.current?.classList.add("pieces_draggable-zone");
    if (pieces && target.classList.contains("piece")) {
      target.classList.add("piece_away");
      const shiftX = e.clientX - target.getBoundingClientRect().left;
      const shiftY = e.clientY - target.getBoundingClientRect().top;
      e.dataTransfer.setData("piece-index", String(index));
      e.dataTransfer.setData("shiftX", String(shiftX));
      e.dataTransfer.setData("shiftY", String(shiftY));
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const dragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log("Drag END", e.target);
    const target = e.target as HTMLDivElement;
    draggableZone.current?.classList.remove("pieces_draggable-zone");
    if (pieces && target.classList.contains("piece")) {
      target.classList.remove("piece_away");
    }
  };
  const drop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!pieces || !draggableZone.current) return;
    const index = parseInt(e.dataTransfer.getData("piece-index"), 10);
    const shiftX = parseInt(e.dataTransfer.getData("shiftX"), 10);
    const shiftY = parseInt(e.dataTransfer.getData("shiftY"), 10);
    const target = e.target as HTMLDivElement;

    const piece = pieces.find((p) => p.index === index);
    console.log("DROP", target);
    if (piece) {
      piece.position = [
        e.clientX - shiftX - draggableZone.current.getBoundingClientRect().left,
        e.clientY - shiftY - draggableZone.current.getBoundingClientRect().top,
      ];

      tryToSnap(pieces, piece, game.snapTrasholdPx);

      const validatedPieces = validatePieces(pieces, game.complexity);
      piece.style = {
        ...piece.style,
        left: piece.position[0],
        top: piece.position[1],
      };
      setPieces(validatedPieces);
    }
  };
  const dragover = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log("Drag Leave");
  };
  const dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Drag Enter");
  };

  return (
    <div className="App">
      <div className="game">
        <div
          className="pieces"
          ref={draggableZone}
          onClickCapture={rotatePiece}
          onDragStartCapture={dragStart}
          onDragEndCapture={dragEnd}
          onDrop={drop}
          onDragOver={dragover}
          onDragLeave={dragLeave}
          onDragEnter={dragEnter}
        >
          {pieces
            ? pieces.map((p) => (
                <div
                  className={`piece piece_draggable ${
                    p.done ? "piece_done" : ""
                  }`}
                  key={p.index}
                  data-piece-index={p.index}
                  style={p.style}
                  draggable
                >
                  {p.index}
                  {p.done ? "✅" : null}
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

export default App;

function validatePieces(pieces: Piece[], N: number): Piece[] {
  // piece is completed when it is not rotated and all neighbors are on place
  for (let piece of pieces) {
    if (piece.rotate % 360 !== 0) {
      piece.done = false;
    } else {
      piece.done = false;
      for (let neighborKey in piece.neighbors) {
        const key = neighborKey as keyof Piece["neighbors"];

        if (
          piece.neighbors[key] &&
          piece.neighbors[key]!.rotate % 360 === 0 &&
          validateNeighborPiece(piece, piece.neighbors[key]!, key)
        ) {
          piece.done = true;
          piece.neighbors[key]!.done = true;
        }
      }
    }
  }
  return [...pieces];
}

function tryToSnap(pieces: Piece[], openPiece: Piece, trashold: number) {
  if (!trashold) return;
  for (let piece of pieces) {
    if (snapPiece(openPiece, piece, trashold)) return;
  }
}
function snapPiece(a: Piece, b: Piece, trashold = 10): Boolean {
  // corrects A position, if it is close to B
  const [xa, ya] = a.position;
  const [xb, yb] = b.position;
  const { width, height } = a;
  const diffX = xa - xb;
  const dX = Math.sign(diffX); // +1 or -1
  const sameX = inRange(Math.abs(diffX), -trashold, trashold);
  const closeX = inRange(Math.abs(diffX), width - trashold, width + trashold);
  if (!sameX && !closeX) return false;

  const diffY = ya - yb;
  const dY = Math.sign(diffY);
  const sameY = inRange(Math.abs(diffY), -trashold, trashold);
  const closeY = inRange(Math.abs(diffY), height - trashold, height + trashold);
  if (!sameY && !closeY) return false;

  if (sameX && sameY) {
    // one under onother
    return false;
  }
  if (closeX && closeY) {
    // coner case
    a.position = [b.position[0] + width * dX, b.position[1] + height * dY];
    return true;
  }
  if (sameX && closeY) {
    // vertical case
    a.position = [b.position[0], b.position[1] + height * dY];
    return true;
  }
  if (closeX && sameY) {
    // horizontal case
    a.position = [b.position[0] + width * dX, b.position[1]];
    return true;
  }
  return false;
}

function inRange(num: number, a: number, b = 0): boolean {
  return Math.min(a, b) <= num && num < Math.max(a, b);
}

function validateNeighborPiece(
  piece: Piece,
  neighbor: Piece,
  type: keyof Piece["neighbors"]
) {
  const [X, Y] = piece.position;
  const [x, y] = neighbor.position;
  const width = piece.width;
  const height = piece.height;
  switch (type) {
    case "t":
      return x === X && Y - y === height;
    case "b":
      return x === X && Y - y === -height;
    case "l":
      return X - x === width && Y === y;
    case "r":
      return X - x === -width && Y === y;
    case "tl":
      return X - x === width && Y - y === height;
    case "tr":
      return X - x === -width && Y - y === height;
    case "bl":
      return X - x === width && Y - y === -height;
    case "br":
      return X - x === -width && Y - y === -height;
  }

  return false;
}
