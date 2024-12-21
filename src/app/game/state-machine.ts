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
  // private availableMoves: AvailableMove[] = [];
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

  // mapCoordsToChessFormat(x: number, y: number): string {
  //   if (this.gameInfo.yourColor === Color.white) {
  //     return `${String.fromCharCode(97 + (7 - x))}${y + 1}`;
  //   }
  //   return `${String.fromCharCode(97 + x)}${y}`;
  // }

  private handleTileClickedInIdleState(x: number, y: number) {
    const selectedPiece = this.board.squares[y][x].getPiece();
    // console.log("---board---", this.board!.squares);

    const from: Coordinate = [x, y];
    const moves = this.game.getAvailableMovementsForCoordinate(from);
    if (!moves?.length) {
      return;
    }
    // this.availableMoves = moves;
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

    // const position: any = {
    //   [Color.white]: [],
    //   [Color.black]: [],
    // };
    // for (let i = 0; i < 8; i++) {
    //   for (let j = 0; j < 8; j++) {
    //     const piece = this.board.squares[i][j].getPiece();
    //     if (piece) {
    //       position[piece.color].push({
    //         type: piece.type,
    //         position: [j, i],
    //       } as any);
    //     }
    //   }
    // }
    // console.log(JSON.stringify(position));

    // if (selectedPiece) {
    //   if (selectedPiece.color === this.gameInfo.yourColor) {
    //     // console.log("Select the piece at row: ", y, " col: ", x);
    //     this.selectedPiece = [x, y];
    //     this.state = GameStateName.PieceSelected;

    //     const pieceRules = selectedPiece.movementRules;
    //     pieceRules?.forEach((rule) => {
    //       const ruleMoves = rule.availableMoves(
    //         x,
    //         y,
    //         this.board!.squares,
    //         this.game?.turns as Turn[]
    //       );

    //       ruleMoves.forEach((move) => {
    //         console.log("Move for piece", this.gameInfo.yourColor, [x, y]);
    //         const check = this.checkMateGlobalRule.doesMoveProvokeCheck(
    //           {
    //             color: this.gameInfo.yourColor,
    //             from: [x, y],
    //             to: [move[0], move[1]],
    //             affects: move[2],
    //             type: TurnType.Move,
    //             pieceType: selectedPiece.type,
    //             timestamp: new Date().toISOString(),
    //             check: false,
    //           } as any,
    //           this.game?.turns
    //         );
    //         if (check) {
    //           // console.log("--rule found moves-->", x, y, ruleMoves);
    //           // console.log(
    //           //   "--->",
    //           //   this.gameInfo.yourColor,
    //           //   [x, y],
    //           //   [move[0], move[1]],
    //           //   move[2]
    //           // );
    //           console.log("excluded move because of check", move);
    //         } else {
    //           console.log("Move possible", [x, y], [move[0], move[1]]);
    //           this.availableMoves.push(move);
    //         }
    //       });
    //     });
    //     // console.log(pieceRules);

    //     this.sceneUpdatesEventEmitter.dispatchEvent(
    //       new CustomEvent(StateMachineEvents.showAvailableMoves, {
    //         detail: {
    //           availableMoves: this.availableMoves,
    //           x,
    //           y,
    //         },
    //       })
    //     );
    //   } else {
    //   }
    // }
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
    // const [fromX, fromY] = this.selectedPiece!;

    // const move = this.availableMoves.find(
    //   (move) => move[0] === x && move[1] === y
    // );
    if (!this.selectedPiece) {
      throw new Error("Piece is not selected, but should be");
    }

    const from: Coordinate = this.selectedPiece;
    const to: Coordinate = [x, y];

    const moveResult = this.game.getMovementResult(from, to);
    // const move = this.findMoveInAvailableMoves(this.availableMoves, [x, y]);

    // console.log("Found move: ", move);
    // this.availableMoves = [];
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
    console.log("turn-", turn);
    console.log("game-", this.game);
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

      // const fromPiece = this.board.squares[fromY][fromX].popPiece() as Piece;
      // const toCell = this.board.squares[toY][toX];

      // if (!toCell.isEmpty()) {
      //   toCell.popPiece();
      // }
      // toCell.putPiece(fromPiece);

      // this.game?.turns.push(turn);
      // this.updateGameNextTurn();

      // const affects = turn.affects;
      // if (affects) {
      //   for (const affect of affects) {
      //     if (affect.from) {
      //       const [affectFromX, affectFromY] = affect.from;
      //       if (affect.type === AffectType.kill) {
      //         this.board.squares[affectFromY][affectFromX].popPiece();
      //       } else if (affect.type === AffectType.move && affect.to) {
      //         const [affectToX, affectToY] = affect.to;
      //         const piece =
      //           this.board.squares[affectFromY][affectFromX].popPiece();
      //         if (!piece) {
      //           throw new Error(
      //             "Piece from affect.from is not found on the board"
      //           );
      //         }
      //         this.board.squares[affectToY][affectToX].putPiece(piece);
      //       }
      //     }
      //   }
      // }
      this.game?.processTurn(turn);

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
