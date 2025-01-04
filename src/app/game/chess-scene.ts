"use client";

import {
  Action,
  Board,
  BoardMeta,
  Color,
  isKillAffect,
  isMoveAffect,
  isTransformationAffect,
  NewPlayerGameData,
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
    color: "black",
    fontSize: "64px",
  },
  [Color.white]: {
    color: "white",
    stroke: "black",
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
  private gameInfo?: NewPlayerGameData;

  private uiToLogicConverter?: ClassUiToLogicconverter;
  private userActionsEventEmitter?: EventTarget;
  private sceneUpdatesEventEmitter: EventTarget = new EventTarget();

  private availableMoveObjects: (
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Arc
  )[] = [];
  private stateMachine?: StateMachine;

  private boardRender?: BoardRenderer;
  private pieceRenderer?: PieceRenderer;

  create = (data: {
    boardMeta: BoardMeta;
    gameInfo: NewPlayerGameData;
    userActionsEventEmitter: EventTarget;
  }) => {
    this.gameInfo = data.gameInfo; // Store the game info

    this.userActionsEventEmitter = data.userActionsEventEmitter;

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
    this.boardRender?.render(this);
    this.renderOffset();
    this.renderPieces();
  }

  renderOffset() {
    if (!this.gameInfo) {
      throw new Error("Game info is not initialized in the scene");
    }

    const { tileSize, offset, boardSize } = this.boardSizeConfig;
    for (let row = 0; row < boardSize; row++) {
      const x = offset / 2;
      const y = row * tileSize + tileSize / 2;
      const [, correctY] = this.correctedXY(x, row);
      const numCoord = correctY + 1;
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

  private pieceGameObjects: { [key in string]: Phaser.GameObjects.Text } = {};
  private coordToMapkey(x: number, y: number) {
    return `${x}${y}`;
  }

  // private needReverseX() {
  //   return this.gameInfo.yourColor === Color.white;
  // }
  // private needReverseY() {
  //   return this.gameInfo.yourColor === Color.white;
  // }

  renderPieces() {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    if (!this.pieceRenderer) {
      throw new Error("Piece renderer is not initialized");
    }
    const colors = [Color.white, Color.black];
    for (const color of colors) {
      this.board.forEachPiece(color, (piece, x, y) => {
        // const colIndex: number = this.correctX(ci); //this.needReverseX() ? 7 - ci : ci;
        // if (piece) {
        const correctedXY = this.correctedXY(x, y);
        const pieceGameObject = this.pieceRenderer!.renderPiece(
          this,
          piece,
          correctedXY[0],
          correctedXY[1]
        );
        this.pieceGameObjects[this.coordToMapkey(x, y)] = pieceGameObject;
        // }
      });
    }
    // this.board.forEachPiece((row, ri) => {
    //   const rowIndex: number = this.correctY(ri); //this.needReverseY() ? 7 - ri : ri;
    //   row.forEach((cell, ci) => {
    //     const colIndex: number = this.correctX(ci); //this.needReverseX() ? 7 - ci : ci;
    //     const piece = cell.getPiece();
    //     if (piece) {
    //       const pieceGameObject = this.pieceRenderer!.renderPiece(
    //         this,
    //         piece,
    //         colIndex,
    //         rowIndex
    //       );
    //       this.pieceGameObjects[this.coordToMapkey(ci, ri)] = pieceGameObject;
    //     }
    //   });
    // });
  }
  renderSelectedPieceHightLight(rawX: number, rawY: number) {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }
    const [x, y] = this.correctedXY(rawX, rawY);
    // if (this.gameInfo.yourColor === Color.white) {
    //   y = 7 - y;
    //   x = 7 - x;
    // }
    // const canvasX = x * this.tileSize + this.tileSize / 2 + this.offset;
    // const canvasY = y * this.tileSize + this.tileSize / 2;

    const selectedPieceObj = this.boardRender!.hightlightSelectedPiece(
      this,
      x,
      y
    );
    this.availableMoveObjects.push(selectedPieceObj);
  }

  // private correctY = (y: number) => (y = 7 - y);
  // private correctX = (x: number) => (x = 7 - x);
  private correctedXY = (x: number, y: number) => {
    if (!this.gameInfo) {
      throw new Error("Game info is not initialized in the scene");
    }
    if (this.gameInfo.yourColor === Color.white) {
      y = 7 - y;
      x = 7 - x;
    }
    return [x, y];
  };

  renderAvailableMoves(actions: Action[]) {
    if (!this.board) {
      throw new Error("Board is not initialized in the scene");
    }

    actions.forEach((action) => {
      for (const affect of action) {
        // TODO there is space for imporvement
        // change colors for affect types,
        // add better highlight when user mouse is above of the highlited action
        if (isMoveAffect(affect) && affect.userSelected) {
          const [x, y] = this.correctedXY(affect.to[0], affect.to[1]);
          const availableMoveObj = this.boardRender!.hightlightMove(this, x, y);
          this.availableMoveObjects.push(availableMoveObj);
        }
        if (isKillAffect(affect)) {
          // const [x, y] = this.correctedXY(affect.from[0], affect.from[1]);
          // const availableMoveObj = this.boardRender!.hightlightCapture(
          //   this,
          //   x,
          //   y
          // );
          // this.availableMoveObjects.push(availableMoveObj);
        }
      }
    });
  }
  destoryAvailableMoves() {
    this.availableMoveObjects.forEach((obj) => obj.destroy());
    this.availableMoveObjects = [];
  }

  movePiece = (affects: Action) => {
    if (!this.gameInfo) {
      throw new Error("Game info is not initialized in the scene");
    }

    affects.forEach((affect) => {
      const [aFromX, aFromY] = affect.from;

      const aFromMovedObjectKey = this.coordToMapkey(aFromX, aFromY);

      if (isMoveAffect(affect) && affect.from) {
        const [aToX, aToY] = affect.to;

        const [processedToX, processedToY] = this.correctedXY(aToX, aToY);
        const aToMovedObjectKey = this.coordToMapkey(aToX, aToY);

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
      } else if (isKillAffect(affect)) {
        const [aFromX, aFromY] = affect.from;

        const fromMovedObjectKey = this.coordToMapkey(aFromX, aFromY);
        this.pieceGameObjects[fromMovedObjectKey].destroy();
        delete this.pieceGameObjects[fromMovedObjectKey];
      } else if (isTransformationAffect(affect)) {
        // this won't work for other transform cases
        const movedObject = this.pieceGameObjects[aFromMovedObjectKey];
        this.pieceRenderer?.changePieceType(
          movedObject,
          affect.destPieceType,
          this.gameInfo!.yourColor
        );
      }
    });
  };

  // socket event handlers

  onMove = (event: unknown) => {
    const { affects } = (event as { detail: { affects: Action } }).detail;
    this.movePiece(affects);
  };

  onShowAvailableMoves = (event: unknown) => {
    const { actions, x, y } = (
      event as {
        detail: {
          actions: Action[];
          x: number;
          y: number;
        };
      }
    ).detail;

    this.renderAvailableMoves(actions);
    this.renderSelectedPieceHightLight(x, y);
  };

  onHideAvailableMoves = () => {
    this.destoryAvailableMoves();
  };

  addEventListners() {
    this.sceneUpdatesEventEmitter.addEventListener(
      StateMachineEvents.showSelectedPieceActions,
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
      StateMachineEvents.showSelectedPieceActions,
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
