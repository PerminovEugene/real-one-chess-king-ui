"use client";

import {
  Color,
  Direction,
  Piece,
  PieceType,
} from "@real_one_chess_king/game-logic";
import Phaser from "phaser";

type Meta = {
  type: PieceType;
  color: Color;
  rules: {
    name: string;
    moveToEmpty: boolean;
    moveToKill: boolean;
    collision: boolean;
    distance: number;
    directions: Set<Direction>;
  };
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

export class ChessScene extends Phaser.Scene {
  constructor() {
    super({ key: "ChessScene" });
  }
  private board: Meta[][] = [];

  init(data: { board: Meta[][] }) {
    this.board = data.board; // Store the board data
  }

  preload() {
    this.load.image("light", "light_tile.png");
    this.load.image("dark", "dark_tile.png");
    // Preload piece images if needed
  }

  create() {
    const boardSize = 8;
    const tileSize = 80;

    // Draw the board
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isDark = (row + col) % 2 === 0;
        const tileKey = isDark ? "dark" : "light";

        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;

        this.add.image(x, y, tileKey).setDisplaySize(tileSize, tileSize);
      }
    }

    // Render pieces based on the passed board
    this.renderPieces(this.board);
  }

  renderPieces(board: Meta[][]) {
    const tileSize = 80;

    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece) {
          const x = colIndex * tileSize + tileSize / 2;
          const y = rowIndex * tileSize + tileSize / 2;
          this.add
            .text(x, y, this.typeToAscii(piece.type, piece.color), {
              fontSize: "64px",
              color: piece.color === "white" ? "#FFF" : "#000",
            })
            .setOrigin(0.5);
        }
      });
    });
  }

  typeToAscii(type: PieceType, color: Color) {
    return colorToTypeToAscii[color][type];
  }
}
