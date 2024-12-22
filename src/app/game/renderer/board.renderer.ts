import { BoardSizeConfig } from "./type";
import { coordinateToTileCoordinate } from "./ui-index-converter";

export type TileDesignConfig = {
  dark: number;
  light: number;
};

export class BoardRenderer {
  constructor(
    private sizeConfig: BoardSizeConfig,
    private tileDesignConfig: TileDesignConfig
  ) {}

  render(scene: Phaser.Scene) {
    const { tileSize, offset, boardSize } = this.sizeConfig;
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isDark = (row + col) % 2 === 1;

        const { dark, light } = this.tileDesignConfig;
        const fillColor = isDark ? dark : light;

        const x = col * tileSize + tileSize / 2 + offset;
        const y = row * tileSize + tileSize / 2;

        scene.add.rectangle(x, y, tileSize, tileSize, fillColor).setOrigin(0.5);
      }
    }
  }

  addHighlight(scene: Phaser.Scene, x: number, y: number) {
    const { canvasX, canvasY } = coordinateToTileCoordinate(
      x,
      y,
      this.sizeConfig
    );
    return scene.add.rectangle(
      canvasX,
      canvasY,
      this.sizeConfig.tileSize,
      this.sizeConfig.tileSize,
      0x0000ff,
      0.5
    );
  }
}
