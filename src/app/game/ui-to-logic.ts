import { Color, NewPlayerGameData } from "@real_one_chess_king/game-logic";
import { TileClickedPayload, UiEvent } from "./events";

export class ClassUiToLogicconverter {
  constructor(
    private tileSize: number,
    private offset: number,
    private gameInfo: NewPlayerGameData,
    private eventEmitter: EventTarget
  ) {}

  private isClickInBoard(x: number, y: number) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  public handleBoardClick = (pointer: { x: number; y: number }) => {
    // Get the canvas coordinates
    const canvasX = pointer.x;
    const canvasY = pointer.y;

    // Convert to grid coordinates
    let col = Math.floor((canvasX - this.offset) / this.tileSize);
    let row = Math.floor(canvasY / this.tileSize);

    if (this.gameInfo.yourColor === Color.white) {
      row = 7 - row;
      col = 7 - col;
    }

    // Check if the click is inside the chessboard
    if (this.isClickInBoard(col, row)) {
      this.eventEmitter.dispatchEvent(
        new CustomEvent(UiEvent.TileClicked, {
          detail: [col, row],
        } as TileClickedPayload)
      );
    }
  };
}
