"use client";

import { useEffect, useState } from "react";
import wsClientInstance from "../../socket/index";
import { Board } from "@real_one_chess_king/game-logic";
import dynamic from "next/dynamic";

const DynamicGameComponent = dynamic(() => import("./game.component"), {
  loading: () => <p>Loading...</p>,
});

export default function GamePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [inQueue, setInQueue] = useState(false);

  useEffect(() => {
    const initConnection = async () => {
      await wsClientInstance.connect();
      setIsConnected(true);
    };

    initConnection();
  }, []);

  const findGame = () => {
    wsClientInstance.sendFindGame(setBoard, setInQueue);
  };

  const showFindButton = isConnected && !board && !inQueue;
  const showInQueueMessage = isConnected && !board && inQueue;
  const showBoard = isConnected && board && !inQueue;

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {!isConnected && <p>Connecting...</p>}
      {showFindButton && (
        <button
          onClick={findGame}
          className="bg-[#f5f5f5] text-[#333] px-4 py-2 rounded-lg shadow-md"
        >
          Find Game
        </button>
      )}
      {showInQueueMessage && <p>Waiting for opponent...</p>}
      {showBoard && <DynamicGameComponent board={board} />}
    </div>
  );
}
