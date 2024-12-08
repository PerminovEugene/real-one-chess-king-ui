import {
  Bishop,
  Board,
  Cell,
  King,
  Knight,
  Pawn,
  Piece,
  PieceType,
  Queen,
  Rook,
} from "@real_one_chess_king/game-logic";

export class GameHolder {
  private board: Board;

  constructor() {
    this.board = new Board();
  }
}
