"use client";

import {
  Board,
  BoardMeta,
  Color,
  Turn,
  Game,
  Player,
  TurnType,
  Piece,
} from "@real_one_chess_king/game-logic";
import { StateMachineEvents, TileClickedPayload, UiEvent } from "./events";
import socket from "../../socket/index";

enum GameStateName {
  Idle = "idle",
  PieceSelected = "pieceSelected",
}

export class StateMachine {
  private board: Board;

  constructor(
    boardMeta: BoardMeta,
    public gameInfo: any,
    private userActionsEventEmitter: EventTarget,
    private sceneUpdatesEventEmitter: EventTarget
  ) {
    this.board = new Board();
    this.board.fillBoard(boardMeta);
    const white = new Player(Color.white); // TODO fix players info
    const black = new Player(Color.black);
    this.game = new Game(white, black, this.board);
    this.setupListeners();
  }

  getBoard() {
    return this.board;
  }

  private boardSize = 8;
  private availableMoves: [number, number][] = [];
  private game: Game | undefined;

  private state = GameStateName.Idle;

  mapCoordsToChessFormat(x: number, y: number): string {
    if (this.gameInfo.yourColor === Color.white) {
      return `${String.fromCharCode(97 + (7 - x))}${y + 1}`;
    }
    return `${String.fromCharCode(97 + x)}${y}`;
  }

  private selectedPiece?: [number, number];

  private handleTileClickedInIdleState(x: number, y: number) {
    const selectedPiece = this.board.squares[y][x].getPiece();
    if (selectedPiece) {
      if (selectedPiece.color === this.gameInfo.yourColor) {
        console.log("Select the piece at row: ", y, " col: ", x);
        this.selectedPiece = [x, y];
        this.state = GameStateName.PieceSelected;

        const pieceRules = selectedPiece.movementRules;
        pieceRules?.forEach((rule) => {
          const ruleMoves = rule.availableMoves(x, y, this.board!.squares);
          this.availableMoves.push(...ruleMoves);
        });

        this.sceneUpdatesEventEmitter.dispatchEvent(
          new CustomEvent(StateMachineEvents.showAvailableMoves, {
            detail: {
              availableMoves: this.availableMoves,
              x,
              y,
            },
          })
        );
      } else {
      }
    }
  }

  includesArray = function (
    source: [number, number][],
    target: [number, number]
  ) {
    return source.some(
      (item) =>
        Array.isArray(item) &&
        Array.isArray(target) &&
        item.length === target.length &&
        item.every((val, index) => val === target[index])
    );
  };

  private handleTileClickedInPieceSelectedState(x: number, y: number) {
    const turn: Turn = {
      color: this.gameInfo.yourColor,
      type: TurnType.Move,
      from: this.mapCoordsToChessFormat(
        this.selectedPiece![0],
        this.selectedPiece![1]
      ),
      to: this.mapCoordsToChessFormat(x, y),
      timestamp: new Date().toISOString(),
    };
    console.log(turn);
    this.state = GameStateName.Idle;

    if (!this.includesArray(this.availableMoves, [x, y])) {
      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.hideAvailableMoves)
      );
      this.availableMoves = [];
      return;
    }
    this.availableMoves = [];

    this.game?.processTurn(turn);
    socket.sendTurn(turn);
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.pieceMoved, {
        detail: {
          from: [this.selectedPiece![0], this.selectedPiece![1]],
          to: [x, y],
        },
      })
    );
  }

  setupListeners() {
    this.userActionsEventEmitter.addEventListener(
      UiEvent.TileClicked,
      (event: any) => {
        const [x, y] = (event as TileClickedPayload).detail;
        if (this.game?.nextTurnColor !== this.gameInfo.yourColor) {
          console.log("Not your turn");
          return;
        }

        if (this.state === GameStateName.PieceSelected) {
          this.handleTileClickedInPieceSelectedState(x, y);
        } else if (this.state === GameStateName.Idle) {
          this.handleTileClickedInIdleState(x, y);
        }
      }
    );
    socket.subscribeOnOpponentTurn((turn: Turn) => {
      // this.game?.processTurn(turn);
      const fromX = this.xCharToIndex(turn.from);
      const fromY = this.yCharToIndex(turn.from);

      const toX = this.xCharToIndex(turn.to);
      const toY = this.yCharToIndex(turn.to);

      const fromPiece = this.board.squares[fromY][fromX].popPiece() as Piece;
      const toCell = this.board.squares[toY][toX];

      if (!toCell.isEmpty()) {
        toCell.popPiece();
      }
      toCell.putPiece(fromPiece);

      this.game?.turns.push(turn);
      this.updateGameNextTurn();

      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.pieceMoved, {
          detail: {
            from: [this.xCharToIndex(turn.from), this.yCharToIndex(turn.from)],
            to: [this.xCharToIndex(turn.to), this.yCharToIndex(turn.to)],
          },
        })
      );
    });
  }

  // todo reuse from board
  public xCharToIndex = (char: string) => char.charCodeAt(0) - 97;
  public yCharToIndex = (char: string) => parseInt(char[1]);
  private updateGameNextTurn() {
    this.game!.nextTurnColor =
      this.game!.nextTurnColor === Color.black ? Color.white : Color.black;
  }
}

/*
 UI clickes -> UI to Logic -> Logic gets coordinates and by game state understands what to do -> UI

 */
