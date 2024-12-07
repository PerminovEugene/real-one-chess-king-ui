"use client";

import React, { useEffect, useRef } from "react";
import wsClientInstance from "@/socket";
import { Board, Turn } from "@real_one_chess_king/game-logic";
import Phaser from "phaser";
import { ChessScene } from "./chess-scene";

const GameComponent = ({ board }: { board: Board }) => {
  const phaserGameRef = useRef<any>(null);
  useEffect(() => {
    wsClientInstance.subscribeOnOpponentTurn((turn: Turn) => {
      console.log(turn);
    });
    const initializeGame = async () => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        scene: [ChessScene],
        parent: phaserGameRef.current,
      };
      phaserGameRef.current = new Phaser.Game(config);
      phaserGameRef.current.scene.start("ChessScene", { board });
    };

    initializeGame();
    // if (board) {
    //   phaserGameRef.current.scene.drawBoard(board);
    // }
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }
      phaserGameRef.current = null;
    };
  }, []);

  return <div id="game-container" ref={phaserGameRef}></div>;
};

export default GameComponent;
