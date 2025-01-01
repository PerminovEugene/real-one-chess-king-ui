"use client";

import React, { useEffect, useState } from "react";
import wsClientInstance from "../../socket/index";
import dynamic from "next/dynamic";
import TurnInfoComponent from "./turn-info.component";
import { NewGameData } from "./game.component";

const DynamicGameComponent = dynamic(() => import("./game.component"), {
  loading: () => <p>Loading...</p>,
});

type NotificationWrapperProps = {
  isConnected: boolean;
  showOponentDisconnected: boolean;
  showInQueueMessage: boolean;
  showWinMessage: boolean;
  showOpponentWon: boolean;
};

export function NotificationWrapper({
  isConnected,
  showOponentDisconnected,
  showInQueueMessage,
  showWinMessage,
  showOpponentWon,
}: NotificationWrapperProps) {
  return (
    <div>
      {!isConnected && <p>Connecting...</p>}
      {showWinMessage && <p>You won! +respect ^^.</p>}
      {showOpponentWon && <p>You lost! -respect :| </p>}
      {showOponentDisconnected && (
        <div>
          <p>Opponent disconnected :| But You won! :D</p>
          <p>Let&#39;s try again</p>
        </div>
      )}
      {showInQueueMessage && <p>Waiting for opponent...</p>}
    </div>
  );
}

export default function GamePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isWon, setWin] = useState(false);
  const [isLost, setLost] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [gameData, setGameData] = useState<NewGameData | null>(null);

  const onOpponentDisconnected = () => {
    setGameData(null);
    setOpponentDisconnected(true);
  };
  const onWin = () => {
    setWin(true);
  };
  const onLost = () => {
    setLost(true);
  };

  useEffect(() => {
    console.log("CONNECTING");
    const initConnection = async () => {
      await wsClientInstance.connect();
      setIsConnected(true);
    };

    initConnection();
    wsClientInstance.subscribeOnOpponentDisconnected(onOpponentDisconnected);
    wsClientInstance.subscribeOnWinEvent(onWin);
    wsClientInstance.subscribeOnLostEvent(onLost);
    return () => {
      wsClientInstance.unsubscribeOnOpponentDisconnected(
        onOpponentDisconnected
      );
      wsClientInstance.unsubscribeOnWinEvent(onWin);
      wsClientInstance.unsubscribeOnLostEvent(onLost);
      wsClientInstance.unsubscribeOnWaitingForOpponent(onInQueue);
      wsClientInstance.unsubscribeOnGameStarted(onGameFound);
    };
  }, []);

  const onGameFound = (data: NewGameData) => {
    setInQueue(false);
    setGameData(data);
  };

  const onInQueue = () => {
    setInQueue(true);
  };

  const findGame = () => {
    setOpponentDisconnected(false);
    wsClientInstance.subscribeOnWaitingForOpponent(onInQueue);
    wsClientInstance.subscribeOnGameStarted(onGameFound);
    wsClientInstance.sendFindGame();
  };

  const showFindButton = isConnected && !gameData && !inQueue;
  const showInQueueMessage = isConnected && !gameData && inQueue;
  const showOponentDisconnected = isConnected && opponentDisconnected;
  const showBoard = isConnected && gameData && !inQueue;

  const onlyBoardVisible =
    showBoard &&
    !showOponentDisconnected &&
    !showInQueueMessage &&
    !showFindButton;
  const gameInProgress = onlyBoardVisible && !isWon && !isLost;

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {showFindButton && (
        <button
          onClick={findGame}
          className="bg-[#f5f5f5] text-[#333] px-4 py-2 rounded-lg shadow-md"
        >
          Find Game
        </button>
      )}
      <NotificationWrapper
        isConnected={isConnected}
        showOponentDisconnected={showOponentDisconnected}
        showInQueueMessage={showInQueueMessage}
        showWinMessage={isWon}
        showOpponentWon={isLost}
      />
      {onlyBoardVisible && (
        <React.Fragment>
          {/* Add stalemate handling */}
          {gameInProgress && (
            <TurnInfoComponent myColor={gameData.gameInfo.yourColor} />
          )}
          <DynamicGameComponent gameData={gameData} />
        </React.Fragment>
      )}
    </div>
  );
}
GamePage.strictMode = false;
