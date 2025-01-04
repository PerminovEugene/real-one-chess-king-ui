"use client";

import React, { useEffect, useRef } from "react";
import {
  BoardMeta,
  Color,
  NewPlayerGameData,
  reverseColor,
} from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ChessScene } from "./chess-scene";
import PieceSelectionComponent from "./piece-selection.component";
import { PlayerTimerComponent } from "./components/player-timer.component";

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
  const opponentTimeLeft = gameInfo.timeLeft[opponentColor];
  const myTimeLeft = gameInfo.timeLeft[myColor];
  const myColorWhite = myColor === Color.white;

  return (
    <div>
      <div className="flex justify-between items-center w-full">
        <p className="font-semibold">{opponentName}</p>

        <PlayerTimerComponent
          timeLeft={opponentTimeLeft}
          initialIsActive={!myColorWhite}
          activeOnMyTurn={false}
        />
      </div>
      <PieceSelectionComponent
        userActionsEventEmitter={userActionsEventEmitter}
      />
      <div id="game-container" ref={phaserGameRef}></div>
      <div className="flex justify-between items-center w-full">
        <p className="font-semibold">{myName}</p>

        <PlayerTimerComponent
          timeLeft={myTimeLeft}
          initialIsActive={myColorWhite}
          activeOnMyTurn={true}
        />
      </div>
    </div>
  );
};

export default GameComponent;
