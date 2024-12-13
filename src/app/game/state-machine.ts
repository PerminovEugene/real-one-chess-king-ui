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
  fromChessToLogic,
  fromLogicToChess,
  AvailableMove,
  AffectType,
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

  private availableMoves: AvailableMove[] = [];
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
          const ruleMoves = rule.availableMoves(
            x,
            y,
            this.board!.squares,
            this.game?.turns as Turn[]
          );
          console.log("--rule found moves-->", x, y, ruleMoves, rule);

          this.availableMoves.push(...ruleMoves);
        });
        console.log(pieceRules);

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

  findMoveInAvailableMoves = function (
    source: AvailableMove[],
    target: [number, number]
  ): AvailableMove | undefined {
    return source.find(
      (item) =>
        Array.isArray(item) &&
        Array.isArray(target) &&
        item.length === target.length &&
        item[0] === target[0] &&
        item[1] === target[1]
    );
  };

  private handleTileClickedInPieceSelectedState(x: number, y: number) {
    const [fromX, fromY] = this.selectedPiece!;
    const turn: Turn = {
      color: this.gameInfo.yourColor,
      type: TurnType.Move,
      from: this.selectedPiece!,
      to: [x, y],
      timestamp: new Date().toISOString(),
      pieceType: this.board.squares[fromY][fromX].getPiece()!.type,
      affects: [],
    };
    this.state = GameStateName.Idle;

    console.log("Available moves: ", this.availableMoves);

    const move = this.availableMoves.find(
      (move) => move[0] === x && move[1] === y
    );
    // const move = this.findMoveInAvailableMoves(this.availableMoves, [x, y]);

    console.log("Found move: ", move);
    this.availableMoves = [];
    if (!move) {
      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.hideAvailableMoves)
      );
      return;
    }

    console.log("Move the piece from row: ", fromY, " col: ", fromX, turn);

    turn.affects = move[2];
    console.log("turn: ", turn);

    this.game?.processTurn(turn);
    socket.sendTurn(turn);
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.pieceMoved, {
        detail: {
          from: [this.selectedPiece![0], this.selectedPiece![1]],
          to: [x, y],
          affects: move[2],
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
      console.log("Opponent turn");
      const [fromX, fromY] = turn.from;
      const [toX, toY] = turn.to;

      const fromPiece = this.board.squares[fromY][fromX].popPiece() as Piece;
      const toCell = this.board.squares[toY][toX];

      if (!toCell.isEmpty()) {
        toCell.popPiece();
      }
      toCell.putPiece(fromPiece);

      this.game?.turns.push(turn);
      this.updateGameNextTurn();

      const affects = turn.affects;
      if (affects) {
        for (const affect of affects) {
          const [affectFromX, affectFromY] = affect.from;
          if (affect.type === AffectType.kill) {
            this.board.squares[affectFromY][affectFromX].popPiece();
          } else if (affect.type === AffectType.move && affect.to) {
            const [affectToX, affectToY] = affect.to;
            const piece =
              this.board.squares[affectFromY][affectFromX].popPiece();
            if (!piece) {
              throw new Error(
                "Piece from affect.from is not found on the board"
              );
            }
            this.board.squares[affectToY][affectToX].putPiece(piece);
          }
        }
      }

      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.pieceMoved, {
          detail: {
            from: [fromX, fromY],
            to: [toX, toY],
            affects: turn.affects,
          },
        })
      );
    });
  }

  private updateGameNextTurn() {
    this.game!.nextTurnColor =
      this.game!.nextTurnColor === Color.black ? Color.white : Color.black;
  }
}

/*
 UI clickes -> UI to Logic -> Logic gets coordinates and by game state understands what to do -> UI

 */
