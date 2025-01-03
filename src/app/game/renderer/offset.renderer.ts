import { BoardSizeConfig } from "./type";

export type TileDesignConfig = {
  dark: number;
  light: number;
};

export class OffsetRenderer {
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
}
