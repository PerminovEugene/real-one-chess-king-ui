"use client";

import {
  Board,
  BoardMeta,
  Color,
  Turn,
  Game,
  Player,
  TurnType,
  Action,
  CheckMateGlobalRule,
  Coordinate,
  PieceType,
  isMoveAffect,
  isTransformationAffect,
  NewPlayerGameData,
} from "@real_one_chess_king/game-logic";
import { StateMachineEvents, TileClickedPayload, UiEvent } from "./events";
import socket from "../../socket/index";

enum GameStateName {
  Idle = "idle",
  PieceSelected = "pieceSelected",
  SelectingTransformation = "selectingTransformation",
}

export class StateMachine {
  public board: Board;
  private selectedPieceCoordinate: [number, number] | null = null;
  private selectedPieceMoveToCoordinate: [number, number] | null = null;
  private selectedPieceType?: PieceType;
  private game: Game;
  private state = GameStateName.Idle;
  private treeLength = 3;

  constructor(
    boardMeta: BoardMeta,
    public gameInfo: NewPlayerGameData,
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
      [new CheckMateGlobalRule()],
      this.treeLength
    );
    this.board = board;

    this.setupListeners();
  }

  getBoard() {
    return this.board;
  }

  private selectedPieceActions: Action[] | undefined = [];
  private actionsWithMoveToSelectedCell: Action[] | undefined = [];
  private actionsWithMoveToSelectedCellAndTransformation: Action[] | undefined =
    [];

  private handleTileClickedInIdleState(x: number, y: number) {
    const from: Coordinate = [x, y];
    this.selectedPieceActions = this.game.getActionsForCoordinate(from);

    if (!this.selectedPieceActions?.length) {
      return;
    }
    this.state = GameStateName.PieceSelected;
    this.selectedPieceCoordinate = from;
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.showSelectedPieceActions, {
        detail: {
          actions: this.selectedPieceActions,
          x,
          y,
        },
      })
    );
  }

  private handleTileClickedInPieceSelectedState = (x: number, y: number) => {
    if (!this.selectedPieceCoordinate) {
      throw new Error("Piece is not selected, but should be");
    }

    // const from: Coordinate = this.selectedPieceCoordinate;
    const to: Coordinate = [x, y];
    this.selectedPieceMoveToCoordinate = to;

    this.actionsWithMoveToSelectedCell = this.selectedPieceActions?.filter(
      (action: Action) => {
        return action.find(
          (affect) =>
            isMoveAffect(affect) &&
            affect.userSelected &&
            affect.to[0] === x &&
            affect.to[1] === y
        );
      }
    );

    if (!this.actionsWithMoveToSelectedCell?.length) {
      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.hideAvailableMoves)
      );
      this.resetSelection();

      return;
    }

    const pieceTypes = this.actionsWithMoveToSelectedCell.filter(
      (action) =>
        action.find(
          (affect) => isTransformationAffect(affect) && affect.userSelected //&& affect.to[0] === x && affect.to[1] === y
        )?.type
    );
    // .map((action) => action.type);
    if (pieceTypes.length > 0) {
      this.state = GameStateName.SelectingTransformation;
      this.userActionsEventEmitter.dispatchEvent(
        new CustomEvent(UiEvent.ShowTransformationOptions, {
          detail: {
            pieceTypes,
          },
        })
      );
      return;
    } else {
      // no transformation needed
      this.actionsWithMoveToSelectedCellAndTransformation =
        this.actionsWithMoveToSelectedCell;
    }

    this.doAction();
  };

  resetSelection() {
    this.state = GameStateName.Idle;
    // all variations of actions for selected piece
    this.selectedPieceActions = undefined;

    this.selectedPieceCoordinate = null;
    this.selectedPieceMoveToCoordinate = null;
    this.selectedPieceType = undefined;
    this.actionsWithMoveToSelectedCell = undefined;
    this.actionsWithMoveToSelectedCellAndTransformation = undefined;
  }

  doAction() {
    if (!this.selectedPieceCoordinate || !this.selectedPieceMoveToCoordinate) {
      throw new Error("Piece or action is not selected, but should be");
    }
    const from: Coordinate = this.selectedPieceCoordinate;
    const to: Coordinate = this.selectedPieceMoveToCoordinate;
    const selectedPieceType = this.selectedPieceType;
    const actionsWithMoveToSelectedCellAndTransformation =
      this.actionsWithMoveToSelectedCellAndTransformation;
    // const affectsWithCorectMove = this.selectedPieceActions?.filter((action) => action);

    // const moveResult = this.game.(from, to, selectedPieceType);
    this.resetSelection();

    if (!actionsWithMoveToSelectedCellAndTransformation?.length) {
      this.sceneUpdatesEventEmitter.dispatchEvent(
        new CustomEvent(StateMachineEvents.hideAvailableMoves)
      );
      return;
    }
    if (actionsWithMoveToSelectedCellAndTransformation?.length > 1) {
      throw new Error("More than one action with move and transformation");
    }
    // this.actionsWithMoveToSelectedCellAndTransformation = this.actionsWithMoveToSelectedCell;

    const moveAffect = actionsWithMoveToSelectedCellAndTransformation[0].find(
      (affect) => isMoveAffect(affect) && affect.userSelected
    );
    const [fromX, fromY] = moveAffect!.from;

    // const [fromX, fromY] = from;
    const turn: Turn = {
      color: this.gameInfo.yourColor,
      type: TurnType.Move,
      affects: actionsWithMoveToSelectedCellAndTransformation[0],
      timestamp: new Date().toISOString(),
      pieceType: this.board.getPiece(fromX, fromY)!.type,
    };
    if (selectedPieceType) {
      turn.selectedPieceType = selectedPieceType;
    }
    this.game?.processTurn(turn);

    socket.sendTurn(turn);
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.pieceMoved, {
        detail: {
          from,
          to,
          affects: actionsWithMoveToSelectedCellAndTransformation[0],
        },
      })
    );
    this.sceneUpdatesEventEmitter.dispatchEvent(
      new CustomEvent(StateMachineEvents.hideAvailableMoves)
    );
  }

  setupListeners = () => {
    this.userActionsEventEmitter.addEventListener(
      UiEvent.TileClicked,
      this.onTileClicked
    );
    this.userActionsEventEmitter.addEventListener(
      UiEvent.TransformationPieceTypeSelected,
      this.onTransformationPieceTypeSelected
    );
    socket.subscribeOnOpponentTurn(this.onOpponentTurn);
    socket.subscribeOnWinEvent(this.onWin);
    socket.subscribeOnLostEvent(this.onLost);
  };

  onTileClicked = (event: unknown) => {
    const [x, y] = (event as TileClickedPayload).detail;
    if (this.game?.nextTurnColor !== this.gameInfo.yourColor) {
      return;
    }
    if (this.state === GameStateName.PieceSelected) {
      this.handleTileClickedInPieceSelectedState(x, y);
    } else if (this.state === GameStateName.Idle) {
      this.handleTileClickedInIdleState(x, y);
    }
  };

  onTransformationPieceTypeSelected = (event: unknown) => {
    if (this.state === GameStateName.SelectingTransformation) {
      const { pieceType } = (event as { detail: { pieceType: PieceType } })
        .detail;
      this.selectedPieceType = pieceType;
      this.actionsWithMoveToSelectedCellAndTransformation =
        this.actionsWithMoveToSelectedCell?.filter((action) =>
          action.find(
            (affect) =>
              isTransformationAffect(affect) &&
              affect.userSelected &&
              affect.destPieceType === pieceType
          )
        );
      this.doAction();
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
          affects: turn.affects,
        },
      })
    );
  };
}

/*
 UI clickes -> UI to Logic -> Logic gets coordinates and by game state understands what to do -> UI

 */
