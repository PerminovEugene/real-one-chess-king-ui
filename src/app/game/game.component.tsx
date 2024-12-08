"use client";

import React, { useEffect, useRef, useState } from "react";
import wsClientInstance from "@/socket";
import { Board, Color, Turn } from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ChessScene } from "./chess-scene";

// React strict mode is needed for development, but it provokes double rendering
// That's why this kind of hack is needed
let componentInited = false;

const GameComponent = ({
  gameData: { board, gameInfo },
}: {
  gameData: {
    board: Board;
    gameInfo: any;
  };
}) => {
  const id = Math.random();
  const phaserGameRef = useRef<any>(null);
  useEffect(() => {
    if (componentInited) {
      return;
    }
    componentInited = true;

    const initializeGame = async () => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 640,
        height: 640,
        scene: [ChessScene],
        parent: phaserGameRef.current,
      };
      phaserGameRef.current = new Phaser.Game(config);
      phaserGameRef.current.scene.start("ChessScene", {
        boardMeta: board,
        gameInfo,
      });
      console.log(gameInfo.yourColor);
    };

    initializeGame();
    // if (board) {
    //   phaserGameRef.current.scene.drawBoard(board);
    // }
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.scene.stop("ChessScene");
        phaserGameRef.current.destroy(true);
      }
      phaserGameRef.current = null;
    };
  }, []);

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
