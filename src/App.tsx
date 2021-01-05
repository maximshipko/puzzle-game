import React from "react";
import "./App.scss";
import picture from "./picture1.jpg";

type GameState = {
  complexity: 2 | 4 | 8 | 16;
  image: string;
  imageSize: [number, number];
  rotatePieces: boolean;
  snapPieces: boolean;
};
type Piece = {
  index: number;
  rotate: number; // 0 | 90 | 180 | 270;
  position: [number, number];
  row: number;
  col: number;
  style: React.CSSProperties; // rendom part
  done: boolean;
};
const initialState: GameState = {
  complexity: 4,
  image: picture,
  imageSize: [400, 400],
  rotatePieces: true,
  snapPieces: true,
};

const makePiece = (game: GameState, index: number): Piece => {
  const [width, height] = game.imageSize;
  const N = game.complexity;
  const pieceWidth = Math.floor(width / N);
  const pieceHeight = Math.floor(height / N);
  const row = Math.floor(index / N);
  const col = index % N;
  const rotate = game.rotatePieces ? Math.floor(Math.random() * 5) * 90 : 0;
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

  return {
    index,
    rotate,
    position,
    row,
    col,
    style,
    done: false,
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
    const pieces: Piece[] = Array(game.complexity * game.complexity)
      .fill(undefined)
      .map((_, i) => makePiece(game, i));
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
        setPieces([...pieces]);
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
      const validatedPieces = validatePieces(game, pieces, index);
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
    // console.log("Drag OVer");
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
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

export default App;

function validatePieces(
  game: GameState,
  pieces: Piece[],
  index: number
): Piece[] {
  const [width, height] = game.imageSize;
  const N = game.complexity;
  const pieceWidth = Math.floor(width / N);
  const pieceHeight = Math.floor(height / N);
  const justDropPiece = pieces.find((p) => p.index === index);

  if (justDropPiece) {
    tryToSnap(pieces, pieceWidth, pieceHeight, justDropPiece);
  }

  return [...pieces];
}

function tryToSnap(
  pieces: Piece[],
  width: number,
  height: number,
  openPiece: Piece
) {
  for (let piece of pieces) {
    if (snapPiece(openPiece, piece, width, height)) return;
  }
}
function snapPiece(
  a: Piece,
  b: Piece,
  width: number,
  height: number,
  trashold = 10
): Boolean {
  // corrects A position, if it is close to B
  const [xa, ya] = a.position;
  const [xb, yb] = b.position;
  const diffX = xa - xb;
  const dX = Math.sign(diffX); // +1 or -1
  const sameX = between(Math.abs(diffX), -trashold, trashold);
  const closeX = between(Math.abs(diffX), width - trashold, width + trashold);
  if (!sameX && !closeX) return false;

  const diffY = ya - yb;
  const dY = Math.sign(diffY);
  const sameY = between(Math.abs(diffY), -trashold, trashold);
  const closeY = between(Math.abs(diffY), height - trashold, height + trashold);
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

function between(n: number, a: number, b: number) {
  return a <= n && n <= b;
}
