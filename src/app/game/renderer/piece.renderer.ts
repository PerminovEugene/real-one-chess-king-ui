import { Color, Piece, PieceType } from "@real_one_chess_king/game-logic";
import { BoardSizeConfig } from "./type";

export type PieceDesignConfig = {
  fontSize: string;
  stroke?: string;
  strokeThickness?: number;
  color: string;
};
export type PieceRendererConfig = {
  [Color.black]: PieceDesignConfig;
  [Color.white]: PieceDesignConfig;
};

const colorToTypeToAscii = {
  [Color.black]: {
    [PieceType.Pawn]: "♟",
    [PieceType.Bishop]: "♝",
    [PieceType.Knight]: "♞",
    [PieceType.Rook]: "♜",
    [PieceType.Queen]: "♛",
    [PieceType.King]: "♚",
  },
  [Color.white]: {
    [PieceType.Pawn]: "♙",
    [PieceType.Bishop]: "♗",
    [PieceType.Knight]: "♘",
    [PieceType.Rook]: "♖",
    [PieceType.Queen]: "♕",
    [PieceType.King]: "♔",
  },
};

export class PieceRenderer {
  constructor(
    private sizeConfig: BoardSizeConfig,
    private pieceRendererConfig: PieceRendererConfig
  ) {}

  renderPiece(
    scene: Phaser.Scene,
    piece: Piece,
    colIndex: number,
    rowIndex: number
  ) {
    const { tileSize, offset } = this.sizeConfig;
    const x = colIndex * tileSize + tileSize / 2 + offset;
    const y = rowIndex * tileSize + tileSize / 2;

    return scene.add
      .text(
        x,
        y,
        this.typeToAscii(piece.type, piece.color),
        this.pieceRendererConfig[piece.color]
      )
      .setOrigin(0.5);
  }

  changePieceType(
    pieceObject: Phaser.GameObjects.Text,
    type: PieceType,
    color: Color
  ) {
    pieceObject.setText(this.typeToAscii(type, color));
  }

  typeToAscii(type: PieceType, color: Color) {
    return colorToTypeToAscii[color][type];
  }
}
