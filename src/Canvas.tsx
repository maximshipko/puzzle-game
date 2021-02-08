import React from "react";

import { PieceType, Piece } from "./Piece";

type CanvasProps = {
  pieces: PieceType[];
  setPieces: React.Dispatch<React.SetStateAction<PieceType[]>>;
  rotatePieces: boolean;
  complexity: number;
  snapTrasholdPx: number;
};

export const Canvas = ({
  pieces,
  setPieces,
  complexity,
  rotatePieces,
  snapTrasholdPx,
}: CanvasProps) => {
  const draggableZone = React.useRef<HTMLDivElement>(null);

  const rotatePiece = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (rotatePieces && pieces && target.classList.contains("piece")) {
      const index = parseInt(target.getAttribute("data-piece-index") || "", 10);
      const piece = pieces.find((p) => p.index === index);
      if (piece) {
        piece.rotate += 90;
        piece.imageStyle = {
          ...piece.imageStyle,
          transform: `rotate(${piece.rotate}deg)`,
        };
        const validatedPieces = validatePieces(pieces, complexity);
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

      tryToSnap(pieces, piece, snapTrasholdPx);

      const validatedPieces = validatePieces(pieces, complexity);
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
  };
  const dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
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
      {pieces ? pieces.map((p) => <Piece {...p} key={p.index} />) : null}
    </div>
  );
};

function validatePieces(pieces: PieceType[], N: number): PieceType[] {
  // piece is completed when it is not rotated and all neighbors are on place
  for (let piece of pieces) {
    if (piece.rotate % 360 !== 0) {
      piece.placed = false;
      piece.completed = false;
    } else {
      piece.placed = false;
      piece.completed = true;
      for (let neighborKey in piece.neighbors) {
        const key = neighborKey as keyof PieceType["neighbors"];
        if (piece.neighbors[key]) {
          if (
            piece.neighbors[key]!.rotate % 360 === 0 &&
            validateNeighborPiece(piece, piece.neighbors[key]!, key)
          ) {
            piece.placed = true;
            piece.completed = piece.completed && true;
            piece.neighbors[key]!.placed = true;
          } else {
            piece.completed = piece.completed && false;
          }
        }
      }
    }
  }
  return [...pieces];
}

function tryToSnap(
  pieces: PieceType[],
  openPiece: PieceType,
  trashold: number
) {
  if (!trashold) return;
  for (let piece of pieces) {
    if (snapPiece(openPiece, piece, trashold)) return;
  }
}

function snapPiece(a: PieceType, b: PieceType, trashold = 10): Boolean {
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
  piece: PieceType,
  neighbor: PieceType,
  type: keyof PieceType["neighbors"]
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
