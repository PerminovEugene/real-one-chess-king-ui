import { BoardSizeConfig } from "./type";

export function coordinateToTileCoordinate(
  x: number,
  y: number,
  sizeConfig: BoardSizeConfig
) {
  const { tileSize, offset } = sizeConfig;
  const canvasX = x * tileSize + tileSize / 2 + offset;
  const canvasY = y * tileSize + tileSize / 2;
  return { canvasX, canvasY };
}
