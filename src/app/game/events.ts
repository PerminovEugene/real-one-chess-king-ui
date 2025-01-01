export enum UiEvent {
  TileClicked = "tileClicked",

  ShowTransformationOptions = "showTransformationOptions",

  TransformationPieceTypeSelected = "transformationPieceTypeSelected",
}

export type TileClickedPayload = {
  detail: [number, number];
};

export enum StateMachineEvents {
  pieceMoved = "pieceMoved",
  showSelectedPieceActions = "showAvailableMoves",
  hideAvailableMoves = "hideAvailableMoves",

  // showTransformationOptions = "showTransformationOptions",
  // transformationPieceTypeSelected = "transformationPieceTypeSelected",

  gameEnded = "gameEnded",
}
