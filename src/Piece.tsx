export type PieceType = {
  index: number;
  rotate: number; // deg
  position: [number, number];
  row: number;
  col: number;
  width: number;
  height: number;
  style: React.CSSProperties;
  imageStyle: React.CSSProperties;
  placed: boolean; // true if at least one neighbor is placed
  completed: boolean; // true if all neighbors are placed
  neighbors: {
    [key in "t" | "b" | "l" | "r" | "tl" | "tr" | "bl" | "br"]?: PieceType;
  };
};

export const Piece = (piece: PieceType) => {
  return (
    <div
      className={`piece piece_draggable ${piece.placed ? "piece_placed" : ""}`}
      data-piece-index={piece.index}
      style={piece.style}
      draggable
    >
      <div className="piece__img" style={piece.imageStyle}>
        {piece.placed ? piece.index : null}
        {piece.completed ? "✅" : null}
      </div>
    </div>
  );
};
