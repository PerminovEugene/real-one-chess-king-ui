"use client";

import React, { useEffect, useRef } from "react";
import {
  BoardMeta,
  NewPlayerGameData,
  reverseColor,
} from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ChessScene } from "./chess-scene";
import PieceSelectionComponent from "./piece-selection.component";

export type NewGameData = {
  boardMeta: BoardMeta;
  gameInfo: NewPlayerGameData;
};

const userActionsEventEmitter: EventTarget = new EventTarget();

const GameComponent = ({
  gameData: { boardMeta, gameInfo },
}: {
  gameData: NewGameData;
}) => {
  const phaserGameRef = useRef<HTMLDivElement | null>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null); // Track Phaser instance

  useEffect(() => {
    if (gameInstanceRef.current) {
      console.log("Phaser game already initialized.");
      return;
    }

    const initializeGame = async () => {
      console.log("init game compoenent with phaser stuff");
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 670,
        height: 670,
        scene: [ChessScene],
        parent: phaserGameRef.current, // Attach Phaser to the div
      };

      gameInstanceRef.current = new Phaser.Game(config);
      gameInstanceRef.current.scene.start("ChessScene", {
        boardMeta: boardMeta,
        gameInfo,
        userActionsEventEmitter,
      });
    };

    if (boardMeta && gameInfo && !gameInstanceRef.current) {
      initializeGame();
    }

    return () => {
      console.log("destroy game");
      if (gameInstanceRef.current) {
        // 1. Stop ChessScene => triggers SHUTDOWN
        gameInstanceRef.current.scene.stop("ChessScene");

        // 2. Remove ChessScene => triggers DESTROY
        gameInstanceRef.current.scene.remove("ChessScene");

        // 3. Destroy the entire game
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [gameInfo]);

  const myColor = gameInfo.yourColor;
  const myName = gameInfo.players[myColor].name;
  const opponentColor = reverseColor(myColor);
  const opponentName = gameInfo.players[opponentColor].name;

  return (
    <div>
      <p>{opponentName}</p>
      <PieceSelectionComponent
        userActionsEventEmitter={userActionsEventEmitter}
      />
      <div id="game-container" ref={phaserGameRef}></div>
      <div>{myName}</div>
    </div>
  );
};

export default GameComponent;
