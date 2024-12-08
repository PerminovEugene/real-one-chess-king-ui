export enum UiEvent {
  TileClicked = "tileClicked",
}

export type TileClickedPayload = {
  detail: [number, number];
};

export enum StateMachineEvents {
  pieceMoved = "pieceMoved",
  showAvailableMoves = "showAvailableMoves",
  hideAvailableMoves = "hideAvailableMoves",
}
