"use client";

import {
  Affect,
  AffectType,
  Board,
  BoardMeta,
  Color,
  PieceType,
} from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ClassUiToLogicconverter } from "./ui-to-logic";
import { StateMachine } from "./state-machine";
import { StateMachineEvents } from "./events";

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
  private offset = 30;
  private tileSize = 80;
  private boardSize = 8;

  private board?: Board;
  private gameInfo: any = {};

  private uiToLogicConverter?: ClassUiToLogicconverter;
  private userActionsEventEmitter: EventTarget = new EventTarget();
  private sceneUpdatesEventEmitter: EventTarget = new EventTarget();

  private availableMoveObjects: Phaser.GameObjects.Rectangle[] = [];
  private stateMachine?: StateMachine;

  create(data: { boardMeta: BoardMeta; gameInfo: any }) {
    this.gameInfo = data.gameInfo; // Store the game info
    this.uiToLogicConverter = new ClassUiToLogicconverter(
      this.tileSize,
      this.offset,
      data.gameInfo,
      this.userActionsEventEmitter
    );
    this.stateMachine = new StateMachine(
      data.boardMeta,
      data.gameInfo,
      this.userActionsEventEmitter,
      this.sceneUpdatesEventEmitter
    );
    this.board = this.stateMachine.getBoard();

    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.showAvailableMoves,
      (event: any) => {
        const { availableMoves, x, y } = event.detail;
        this.renderAvailableMoves(availableMoves);
        this.renderSelectedPieceHightLight(x, y);
      }
    );
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.hideAvailableMoves,
      () => {
        this.destoryAvailableMoves();
      }
    );
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.pieceMoved,
      (event: any) => {
        this.movePiece(event.detail);
      }
    );
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.gameEnded,
      () => {
        // TODO
      }
    );

    this.input.on("pointerdown", this.uiToLogicConverter.handleBoardClick);
    this.render();
  }

  preload() {
    this.load.image("light", "light_tile.png");
    this.load.image("dark", "dark_tile.png");
  }

  shutdown() {
    // Cleanup resources when the scene is stopped
    console.log("ChessScene shutdown");
  }

  destroy() {
    console.log("ChessScene destroyed");
  }

  render() {
    this.renderBoard();
    this.renderOffset();
    this.renderPieces();
  }

  renderOffset() {
    for (let row = 0; row < this.boardSize; row++) {
      const x = this.offset / 2;
      const y = row * this.tileSize + this.tileSize / 2;
      const numCoord = this.needReverseY() ? 8 - row : row + 1;
      this.add
        .text(x, y, [numCoord].join(","), {
          fontSize: "15px",
          color: "#FFF",
        })
        .setOrigin(0.5);
    }
    for (let col = 0; col < this.boardSize; col++) {
      const x = col * this.tileSize + this.tileSize / 2 + this.offset;
      const y = this.boardSize * this.tileSize + this.offset / 2;

      const charCoord = String.fromCharCode(
        (this.gameInfo.yourColor === Color.black ? 7 - col : col) + 97
      );
      this.add
        .text(x, y, [charCoord].join(","), {
          fontSize: "15px",
          color: "#FFF",
        })
        .setOrigin(0.5);
    }
  }

  renderBoard() {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const isDark = (row + col) % 2 === 1;
        const tileKey = isDark ? "dark" : "light";

        const x = col * this.tileSize + this.tileSize / 2 + this.offset;
        const y = row * this.tileSize + this.tileSize / 2;

        this.add
          .image(x, y, tileKey)
          .setDisplaySize(this.tileSize, this.tileSize);
      }
    }
  }

  private pieceGameObjects: { [key in string]: Phaser.GameObjects.Text } = {};
  private coordToMapkey(x: number, y: number) {
    return `${x}${y}`;
  }

  private needReverseX() {
    return this.gameInfo.yourColor === Color.white;
  }
  private needReverseY() {
    return this.gameInfo.yourColor === Color.white;
  }

  renderPieces() {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }

    this.board.squares.forEach((row, ri) => {
      const rowIndex: number = this.needReverseY() ? 7 - ri : ri;

      row.forEach((cell, ci) => {
        const colIndex: number = this.needReverseX() ? 7 - ci : ci;

        const piece = cell.getPiece();
        if (piece) {
          const x = colIndex * this.tileSize + this.tileSize / 2 + this.offset;
          const y = rowIndex * this.tileSize + this.tileSize / 2;
          const pieceGameObject = this.add
            .text(x, y, this.typeToAscii(piece.type, piece.color), {
              fontSize: "64px",
              color: piece.color === "white" ? "#FFF" : "#000",
            })
            .setOrigin(0.5);
          this.pieceGameObjects[this.coordToMapkey(ci, ri)] = pieceGameObject;
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
      x = 7 - x;
    }
    const canvasX = x * this.tileSize + this.tileSize / 2 + this.offset;
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
  renderAvailableMoves(availableMoves: [number, number][]) {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    availableMoves.forEach(([x, y]) => {
      if (this.gameInfo.yourColor === Color.white) {
        y = 7 - y;
        x = 7 - x;
      }
      const canvasX = x * this.tileSize + this.tileSize / 2 + this.offset;
      const canvasY = y * this.tileSize + this.tileSize / 2;
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
  }

  movePiece = ({
    from,
    to,
    affects,
  }: {
    from: [number, number];
    to: [number, number];
    affects: Affect[];
  }) => {
    this.destoryAvailableMoves();
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    const processedToY = this.needReverseY() ? 7 - toY : toY;
    const processedToX = this.needReverseX() ? 7 - toX : toX;

    const fromMovedObjectKey = this.coordToMapkey(fromX, fromY);
    const movedObject = this.pieceGameObjects[fromMovedObjectKey];

    const toMovedObjectKey = this.coordToMapkey(toX, toY);

    if (affects && affects.length > 0) {
      affects.forEach((affect) => {
        if (affect.type === AffectType.kill && affect.from) {
          const [aFromX, aFromY] = affect.from;

          const fromMovedObjectKey = this.coordToMapkey(aFromX, aFromY);
          this.pieceGameObjects[fromMovedObjectKey].destroy();
          delete this.pieceGameObjects[fromMovedObjectKey];
        }
      });
    }

    const canvasX =
      processedToX * this.tileSize + this.tileSize / 2 + this.offset;
    const canvasY = processedToY * this.tileSize + this.tileSize / 2;

    movedObject.setX(canvasX);
    movedObject.setY(canvasY);
    movedObject.setOrigin(0.5, 0.5);

    delete this.pieceGameObjects[fromMovedObjectKey];
    this.pieceGameObjects[toMovedObjectKey] = movedObject;

    if (affects && affects.length > 0) {
      affects.forEach((affect) => {
        if (affect.type === AffectType.move && affect.from) {
          const [aFromX, aFromY] = affect.from;

          if (!affect.to) {
            throw new Error("Affect type move should have to field");
          }
          const [aToX, aToY] = affect.to;
          const processedToY = this.needReverseY() ? 7 - aToY : aToY;
          const processedToX = this.needReverseX() ? 7 - aToX : aToX;

          const aFromMovedObjectKey = this.coordToMapkey(aFromX, aFromY);
          const aToMovedObjectKey = this.coordToMapkey(aToX, aToY);

          const canvasX =
            processedToX * this.tileSize + this.tileSize / 2 + this.offset;
          const canvasY = processedToY * this.tileSize + this.tileSize / 2;

          const movedObject = this.pieceGameObjects[aFromMovedObjectKey];

          movedObject.setX(canvasX);
          movedObject.setY(canvasY);
          movedObject.setOrigin(0.5, 0.5);

          this.pieceGameObjects[aToMovedObjectKey] = movedObject;
          delete this.pieceGameObjects[aFromMovedObjectKey];
        }
      });
    }
  };

  typeToAscii(type: PieceType, color: Color) {
    return colorToTypeToAscii[color][type];
  }
}
