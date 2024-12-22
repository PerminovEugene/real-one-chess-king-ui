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
import { BoardRenderer } from "./renderer/board.renderer";
import { PieceRenderer, PieceRendererConfig } from "./renderer/piece.renderer";
import { coordinateToTileCoordinate } from "./renderer/ui-index-converter";

const BROWN_COLOR = 0xb88b4a;
const YELLOW_COLOR = 0xe4c170;

const pieceRendererConfig: PieceRendererConfig = {
  [Color.black]: {
    color: "black" as any,
    // stroke: "white" as any,
    fontSize: "64px",
    // strokeThickness: 2,
  },
  [Color.white]: {
    color: "white" as any,
    stroke: "black" as any,
    fontSize: "64px",
    strokeThickness: 2,
  },
};

export class ChessScene extends Phaser.Scene {
  constructor() {
    super({ key: "ChessScene" });
  }
  private boardSizeConfig = {
    tileSize: 80,
    offset: 30,
    boardSize: 8,
  };

  private board?: Board;
  private gameInfo: any = {};

  private uiToLogicConverter?: ClassUiToLogicconverter;
  private userActionsEventEmitter: EventTarget = new EventTarget();
  private sceneUpdatesEventEmitter: EventTarget = new EventTarget();

  private availableMoveObjects: Phaser.GameObjects.Rectangle[] = [];
  private stateMachine?: StateMachine;

  private boardRender?: BoardRenderer;
  private pieceRenderer?: PieceRenderer;

  create = (data: { boardMeta: BoardMeta; gameInfo: any }) => {
    this.gameInfo = data.gameInfo; // Store the game info
    this.uiToLogicConverter = new ClassUiToLogicconverter(
      this.boardSizeConfig.tileSize,
      this.boardSizeConfig.offset,
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

    this.addEventListners();

    this.input.on("pointerdown", this.uiToLogicConverter.handleBoardClick);

    this.boardRender = new BoardRenderer(this.boardSizeConfig, {
      dark: BROWN_COLOR,
      light: YELLOW_COLOR,
    });
    this.pieceRenderer = new PieceRenderer(
      this.boardSizeConfig,
      pieceRendererConfig
    );
    this.render();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });

    this.events.on(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  };

  // destructors

  shutdown = () => {
    console.log("Scene shutdown");
    this.removeEventListners();
    this.stateMachine?.destroy();
  };

  destroy = () => {
    console.log("Scene destroy");
    this.removeEventListners();
    this.stateMachine?.destroy();
  };

  // render

  render() {
    this.renderBoard();
    this.renderOffset();
    this.renderPieces();
  }

  renderOffset() {
    const { tileSize, offset, boardSize } = this.boardSizeConfig;
    for (let row = 0; row < boardSize; row++) {
      const x = offset / 2;
      const y = row * tileSize + tileSize / 2;
      const numCoord = this.needReverseY() ? 8 - row : row + 1;
      this.add
        .text(x, y, [numCoord].join(","), {
          fontSize: "15px",
          color: "#FFF",
        })
        .setOrigin(0.5);
    }
    for (let col = 0; col < boardSize; col++) {
      const x = col * tileSize + tileSize / 2 + offset;
      const y = boardSize * tileSize + offset / 2;

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
    this.boardRender?.render(this);
    // for (let row = 0; row < this.boardSize; row++) {
    //   for (let col = 0; col < this.boardSize; col++) {
    //     const isDark = (row + col) % 2 === 1;
    //     const tileKey = isDark ? "dark" : "light";

    //     const x = col * this.tileSize + this.tileSize / 2 + this.offset;
    //     const y = row * this.tileSize + this.tileSize / 2;

    //     this.add
    //       .image(x, y, tileKey)
    //       .setDisplaySize(this.tileSize, this.tileSize);
    //   }
    // }
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
    if (!this.pieceRenderer) {
      throw new Error("Piece renderer is not initialized");
    }
    this.board.squares.forEach((row, ri) => {
      const rowIndex: number = this.needReverseY() ? 7 - ri : ri;
      row.forEach((cell, ci) => {
        const colIndex: number = this.needReverseX() ? 7 - ci : ci;
        const piece = cell.getPiece();
        if (piece) {
          const pieceGameObject = this.pieceRenderer!.renderPiece(
            this,
            piece,
            colIndex,
            rowIndex
          );
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
    // const canvasX = x * this.tileSize + this.tileSize / 2 + this.offset;
    // const canvasY = y * this.tileSize + this.tileSize / 2;

    const selectedPieceObj = this.boardRender!.addHighlight(this, x, y);
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
      const availableMoveObj = this.boardRender!.addHighlight(this, x, y);
      this.availableMoveObjects.push(availableMoveObj);
    });
  }
  destoryAvailableMoves() {
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

    const { canvasX, canvasY } = coordinateToTileCoordinate(
      processedToX,
      processedToY,
      this.boardSizeConfig
    );

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

          // const canvasX =
          //   processedToX * this.tileSize + this.tileSize / 2 + this.offset;
          // const canvasY = processedToY * this.tileSize + this.tileSize / 2;

          const { canvasX, canvasY } = coordinateToTileCoordinate(
            processedToX,
            processedToY,
            this.boardSizeConfig
          );

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

  // socket event handlers

  onMove = (event: any) => {
    this.movePiece(event.detail);
  };

  onShowAvailableMoves = (event: any) => {
    const { availableMoves, x, y } = event.detail;
    this.renderAvailableMoves(availableMoves);
    this.renderSelectedPieceHightLight(x, y);
  };

  onHideAvailableMoves = () => {
    this.destoryAvailableMoves();
  };

  private listners = {};

  addEventListners() {
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.showAvailableMoves,
      this.onShowAvailableMoves
    );
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.hideAvailableMoves,
      this.onHideAvailableMoves
    );
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.pieceMoved,
      this.onMove
    );
  }

  removeEventListners() {
    this.sceneUpdatesEventEmitter.removeEventListener(
      StateMachineEvents.showAvailableMoves,
      this.onShowAvailableMoves
    );
    this.sceneUpdatesEventEmitter.removeEventListener(
      StateMachineEvents.hideAvailableMoves,
      this.onHideAvailableMoves
    );
    this.sceneUpdatesEventEmitter.removeEventListener(
      StateMachineEvents.pieceMoved,
      this.onMove
    );
  }
}
