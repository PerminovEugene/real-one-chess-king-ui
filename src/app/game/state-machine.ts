"use client";

import {
  Board,
  BoardMeta,
  Color,
  Turn,
  Game,
  Player,
  TurnType,
  AvailableMove,
  CheckMateGlobalRule2,
  Coordinate,
} from "@real_one_chess_king/game-logic";
import { StateMachineEvents, TileClickedPayload, UiEvent } from "./events";
import socket from "../../socket/index";

enum GameStateName {
  Idle = "idle",
  PieceSelected = "pieceSelected",
}

export class StateMachine {
  public board: Board;
  private selectedPiece?: [number, number];
  private game: Game;
  private state = GameStateName.Idle;
  private treeLength = 3;

  constructor(
    boardMeta: BoardMeta,
    public gameInfo: any,
    private userActionsEventEmitter: EventTarget,
    private sceneUpdatesEventEmitter: EventTarget
  ) {
    const board = new Board();
    board.fillBoardByMeta(boardMeta);
    const white = new Player(Color.white); // TODO fix players info
    const black = new Player(Color.black);
    this.game = new Game(
      white,
      black,
      board,
      [new CheckMateGlobalRule2(board)],
      this.treeLength
    );
    this.board = board;

    this.setupListeners();
  }

  getBoard() {
    return this.board;
  }

  private handleTileClickedInIdleState(x: number, y: number) {
    const from: Coordinate = [x, y];
    const moves = this.game.getAvailableMovementsForCoordinate(from);
    if (!moves?.length) {
      return;
    }
    this.state = GameStateName.PieceSelected;
    this.selectedPiece = from;
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.showAvailableMoves, {
        detail: {
          availableMoves: moves,
          x,
          y,
        },
      })
    );
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

  private handleTileClickedInPieceSelectedState = (x: number, y: number) => {
    if (!this.selectedPiece) {
      throw new Error("Piece is not selected, but should be");
    }

    const from: Coordinate = this.selectedPiece;
    const to: Coordinate = [x, y];

    const moveResult = this.game.getMovementResult(from, to);
    this.state = GameStateName.Idle;
    if (!moveResult) {
      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.hideAvailableMoves)
      );
      return;
    }

    const [fromX, fromY] = from;
    const turn: Turn = {
      color: this.gameInfo.yourColor,
      type: TurnType.Move,
      from,
      to,
      timestamp: new Date().toISOString(),
      pieceType: this.board.squares[fromY][fromX].getPiece()!.type,
      affects: moveResult.affects,
    };
    this.game?.processTurn(turn);

    socket.sendTurn(turn);
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.pieceMoved, {
        detail: {
          from,
          to,
          affects: moveResult.affects,
        },
      })
    );
  };

  setupListeners = () => {
    this.userActionsEventEmitter.addEventListener(
      UiEvent.TileClicked,
      this.onTileClicked
    );
    socket.subscribeOnOpponentTurn(this.onOpponentTurn);
    socket.subscribeOnWinEvent(this.onWin);
    socket.subscribeOnLostEvent(this.onLost);
  };

  onTileClicked = (event: any) => {
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
  };

  onLost = () => {
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.gameEnded)
    );
  };
  onWin = () => {
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.gameEnded)
    );
  };

  destroy = () => {
    socket.unsubscribeOnOpponentTurn(this.onOpponentTurn);
    socket.unsubscribeOnLostEvent(this.onLost);
    socket.unsubscribeOnWinEvent(this.onWin);

    this.userActionsEventEmitter.removeEventListener(
      UiEvent.TileClicked,
      this.onTileClicked
    );
  };

  onOpponentTurn = (turn: Turn) => {
    this.game?.processTurn(turn);

    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.pieceMoved, {
        detail: {
          from: turn.from,
          to: turn.to,
          affects: turn.affects,
        },
      })
    );
  };
}

/*
 UI clickes -> UI to Logic -> Logic gets coordinates and by game state understands what to do -> UI

 */
