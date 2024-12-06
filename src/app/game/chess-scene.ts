"use client";

import Phaser from "phaser";

export class ChessScene extends Phaser.Scene {
  constructor() {
    super({ key: "ChessScene" });
  }

  preload() {
    this.load.image("light", "light_tile.png");
    this.load.image("dark", "dark_tile.png");
  }

  create() {
    const boardSize = 8;
    const tileSize = 80; // Adjust based on your tile image size

    // Start coordinates for top-left corner of the board
    const offsetX = 0;
    const offsetY = 0;

    // Create the board
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        // Determine if this should be a dark or light tile
        const isDark = (row + col) % 2 === 0;
        const tileKey = isDark ? "dark" : "light";

        const x = offsetX + col * tileSize + tileSize / 2;
        const y = offsetY + row * tileSize + tileSize / 2;

        this.add.image(x, y, tileKey).setDisplaySize(tileSize, tileSize);
      }
    }
  }
}
