"use client";

import {
  Board,
  BoardMeta,
  Color,
  Direction,
  Game,
  Piece,
  PieceType,
  Player,
} from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ClassUiToLogicconverter } from "./ui-to-logic";
import { EventEmitter } from "events";

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
  private tileSize = 80;
  private boardSize = 8;

  private board?: Board;
  private gameInfo: any = {};
  private availableMoves: [number, number][] = [];
  private gameData?: Game | undefined;

  private uiToLogicConverter?: ClassUiToLogicconverter;
  private eventEmitter: EventTarget = new EventTarget();
  private availableMoveObjects: Phaser.GameObjects.Rectangle[] = [];

  init(data: { boardMeta: BoardMeta; gameInfo: any }) {
    this.board = new Board();
    this.board.fillBoard(data.boardMeta);

    this.gameInfo = data.gameInfo; // Store the game info

    const white = new Player(this.gameInfo);
    console.log("--", this.gameInfo);
    const black = new Player(Color.black);
    this.gameData = new Game(white, black, this.board);

    this.uiToLogicConverter = new ClassUiToLogicconverter(
      this.tileSize,
      this.board,
      data.gameInfo,
      this.eventEmitter
    );

    this.eventEmitter.addEventListener("pieceSelected", (event: any) => {
      const [x, y] = event.detail;
      if (this.gameData?.nextTurnColor !== this.gameInfo.yourColor) {
        return;
      }
      const pieceRules = this.board?.squares[y][x].getPiece()?.movementRules;
      pieceRules?.forEach((rule) => {
        const ruleMoves = rule.availableMoves(x, y, this.board!.squares);
        console.log(ruleMoves);
        this.availableMoves.push(...ruleMoves);
      });
      console.log("availableMoves", this.availableMoves);
      this.renderAvailableMoves();
      this.renderSelectedPieceHightLight(x, y);
    });
    this.eventEmitter.addEventListener("pieceUnselected", () => {
      this.destoryAvailableMoves();
    });

    this.input.on("pointerdown", this.uiToLogicConverter.handleBoardClick);
  }

  preload() {
    this.load.image("light", "light_tile.png");
    this.load.image("dark", "dark_tile.png");
  }

  create() {
    this.render();
  }

  render() {
    this.renderBoard();
    this.renderAvailableMoves();
    this.renderPieces();
  }

  renderBoard() {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const isDark = (row + col) % 2 === 0;
        const tileKey = isDark ? "dark" : "light";

        const x = col * this.tileSize + this.tileSize / 2;
        const y = row * this.tileSize + this.tileSize / 2;

        this.add
          .image(x, y, tileKey)
          .setDisplaySize(this.tileSize, this.tileSize);
      }
    }
  }

  renderPieces() {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    const tileSize = 80;
    const needReverse = this.gameInfo.yourColor === Color.white;

    const squares = needReverse
      ? this.board.squares.slice().reverse()
      : this.board.squares;

    squares.forEach((row, rowIndex) => {
      const processedRow = needReverse ? row.slice().reverse() : row;

      processedRow.forEach((cell, colIndex) => {
        const piece = cell.getPiece();
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
  renderSelectedPieceHightLight(x: number, y: number) {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    if (this.gameInfo.yourColor === Color.white) {
      y = 7 - y;
    }
    const canvasX = x * this.tileSize + this.tileSize / 2;
    const canvasY = y * this.tileSize + this.tileSize / 2;
    const selectedPieceObj = this.add.rectangle(
      canvasX,
      canvasY,
      this.tileSize,
      this.tileSize,
      0x0000ff,
      0.5
    );
    this.availableMoveObjects.push(selectedPieceObj);
  }

  renderAvailableMoves() {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    this.availableMoves.forEach(([x, y]) => {
      if (this.gameInfo.yourColor === Color.white) {
        y = 7 - y;
      }
      const canvasX = x * this.tileSize + this.tileSize / 2;
      const canvasY = y * this.tileSize + this.tileSize / 2;
      // this.add
      //   .image(x, y, "highlight")
      //   .setDisplaySize(this.tileSize, this.tileSize);
      const availableMoveObj = this.add.rectangle(
        canvasX,
        canvasY,
        this.tileSize,
        this.tileSize,
        0xff0000,
        0.5
      );
      this.availableMoveObjects.push(availableMoveObj);
    });
  }
  private destoryAvailableMoves() {
    this.availableMoveObjects.forEach((obj) => obj.destroy());
    this.availableMoveObjects = [];
    this.availableMoves = [];
  }

  typeToAscii(type: PieceType, color: Color) {
    return colorToTypeToAscii[color][type];
  }
}
