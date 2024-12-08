import { Board, Color, Game } from "@real_one_chess_king/game-logic";

export class ClassUiToLogicconverter {
  constructor(
    private tileSize: number,
    private board: Board,
    private gameInfo: any,
    private eventEmitter: EventTarget
  ) {}

  private isMyPieceSelected = false;

  private isClickInBoard(x: number, y: number) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  public handleBoardClick = (pointer: any) => {
    // Get the canvas coordinates
    console.log(pointer);
    const canvasX = pointer.x;
    const canvasY = pointer.y;

    const boardOffsetX = 0;
    const boardOffsetY = 0;

    // Convert to grid coordinates
    let col = Math.floor((canvasX - boardOffsetX) / this.tileSize);
    let row = Math.floor((canvasY - boardOffsetY) / this.tileSize);

    if (this.gameInfo.yourColor === Color.white) {
      row = 7 - row;
    }

    // Check if the click is inside the chessboard
    if (this.isClickInBoard(col, row)) {
      const selectedPiece = this.board.squares[row][col].getPiece();
      console.log(`Valid tile clicked: Row ${row}, Col ${col}`);
      if (this.isMyPieceSelected) {
        // Move the piece
        console.log("Move the piece to row: ", row, " col: ", col);
        this.isMyPieceSelected = false;
        this.eventEmitter.dispatchEvent(new CustomEvent("pieceUnselected"));

        // this.eventEmitter.emit()
      } else {
        // Select the piece
        if (selectedPiece) {
          if (selectedPiece.color === this.gameInfo.yourColor) {
            console.log("Select the piece at row: ", row, " col: ", col);
            this.eventEmitter.dispatchEvent(
              new CustomEvent("pieceSelected", { detail: [col, row] })
            );

            this.isMyPieceSelected = true;
          } else {
            console.log("Selected not your color");
          }
        }
      }
    } else {
      console.log("Click is outside the chessboard.");
    }
  };
}
