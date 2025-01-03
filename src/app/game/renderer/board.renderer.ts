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

  // addHighlight(scene: Phaser.Scene, x: number, y: number) {
  //   const { canvasX, canvasY } = coordinateToTileCoordinate(
  //     x,
  //     y,
  //     this.sizeConfig
  //   );
  //   // return scene.add.rectangle(
  //   //   canvasX,
  //   //   canvasY,
  //   //   this.sizeConfig.tileSize,
  //   //   this.sizeConfig.tileSize,
  //   //   0x0000ff,
  //   //   0.5
  //   // );

  //   const circle = scene.add.circle(
  //     canvasX,
  //     canvasY,
  //     this.sizeConfig.tileSize / 2, // radius
  //     0x0000ff, // fill color (ignored if alpha = 0)
  //     0 // fill alpha => 0 means fully transparent
  //   );

  //   // Set the stroke to 2px and the same color (or any color you want)
  //   circle.setStrokeStyle(2, 0x0000ff);
  //   return circle;
  // }

  hightlightCapture(scene: Phaser.Scene, x: number, y: number) {
    const { canvasX, canvasY } = coordinateToTileCoordinate(
      x,
      y,
      this.sizeConfig
    );

    const circle = scene.add.circle(
      canvasX,
      canvasY,
      this.sizeConfig.tileSize / 2,
      // this.sizeConfig.tileSize,
      0xff0000,
      0
    );
    circle.setStrokeStyle(2, 0xff0000);
    return circle;
  }

  hightlightMove(scene: Phaser.Scene, x: number, y: number) {
    const { canvasX, canvasY } = coordinateToTileCoordinate(
      x,
      y,
      this.sizeConfig
    );

    const BROWN_COLOR = 0xb88b4a;
    const YELLOW_COLOR = 0xe4c170;

    const circle = scene.add.circle(
      canvasX,
      canvasY,
      this.sizeConfig.tileSize * 0.4, // slightly smaller radius for visual appeal
      YELLOW_COLOR,
      0.3 // 30% opacity for the fill
    );

    // Add a 3px stroke in a softer yellow tone with near-full opacity
    circle.setStrokeStyle(3, BROWN_COLOR, 0.8);

    scene.tweens.add({
      targets: circle,
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return circle;
  }

  hightlightSelectedPiece(scene: Phaser.Scene, x: number, y: number) {
    const { canvasX, canvasY } = coordinateToTileCoordinate(
      x,
      y,
      this.sizeConfig
    );

    const circle = scene.add.circle(
      canvasX,
      canvasY,
      this.sizeConfig.tileSize * 0.4, // radius
      0xe4c170, // fill color (ignored if alpha = 0)
      0 // fill alpha => 0 means fully transparent
    );

    // Set the stroke to 2px and the same color (or any color you want)
    circle.setStrokeStyle(2, 0x00ffff);
    return circle;
  }
}
