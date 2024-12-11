"use client";

import React, { useEffect, useRef } from "react";
import { Board, Color } from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ChessScene } from "./chess-scene";

const GameComponent = ({
  gameData: { board, gameInfo },
}: {
  gameData: {
    board: Board;
    gameInfo: any;
  };
}) => {
  const phaserGameRef = useRef<HTMLDivElement | null>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null); // Track Phaser instance

  useEffect(() => {
    if (gameInstanceRef.current) {
      console.log("Phaser game already initialized.");
      return;
    }

    const initializeGame = async () => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 670,
        height: 670,
        scene: [ChessScene],
        parent: phaserGameRef.current, // Attach Phaser to the div
      };

      gameInstanceRef.current = new Phaser.Game(config);
      gameInstanceRef.current.scene.start("ChessScene", {
        boardMeta: board,
        gameInfo,
      });
    };

    initializeGame();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.scene.stop("ChessScene");
        gameInstanceRef.current.destroy(true); // Properly clean up Phaser instance
        gameInstanceRef.current = null;
      }
      // phaserGameRef.current = null;
    };
  }, [board, gameInfo]); // Dependencies ensure effect is stable

  const myColor = gameInfo.yourColor;
  const myName = gameInfo.players[myColor].name;
  const opponentColor = myColor === Color.white ? Color.black : Color.white;
  const opponentName = gameInfo.players[opponentColor].name;

  return (
    <div>
      <p>{opponentName}</p>
      <div id="game-container" ref={phaserGameRef}></div>
      <div>{myName}</div>
    </div>
  );
};

export default GameComponent;
