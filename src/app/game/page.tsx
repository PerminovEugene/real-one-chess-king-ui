"use client";

import React, { useEffect, useState } from "react";
import wsClientInstance from "../../socket/index";
import dynamic from "next/dynamic";
import TurnInfoComponent from "./components/turn-info.component";
import { NewGameData } from "./game.component";
import { GameStatusBar } from "./components/game-status-bar.component";
import { SurrenderButton } from "./components/surrender.button";

const DynamicGameComponent = dynamic(() => import("./game.component"), {
  loading: () => <p>Loading...</p>,
});

export default function GamePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isWon, setWin] = useState(false);
  const [isLost, setLost] = useState(false);
  const [isMeSurrender, setMySurrender] = useState(false);
  const [isOpponentSurrender, setOpponentSurrender] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [gameData, setGameData] = useState<NewGameData | null>(null);
  const [myTimeOut, setMyTimeOut] = useState(false);
  const [opponentTimeOut, setOpponentTimeOut] = useState(false);

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
  const onOpponentSurrender = () => {
    setOpponentSurrender(true);
  };
  const onSurrenderConfirmed = () => {
    setMySurrender(true);
  };
  const onOpponentTimeOut = () => {
    setOpponentTimeOut(true);
  };
  const onMyTimeOut = () => {
    setMyTimeOut(true);
  };

  const onGameFound = (data: NewGameData) => {
    setInQueue(false);
    setGameData(data);
  };
  const onInQueue = () => {
    setInQueue(true);
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
    wsClientInstance.subscribeOnOpponentSurrender(onOpponentSurrender);
    wsClientInstance.subscribeOnSurrenderConfirmed(onSurrenderConfirmed);
    wsClientInstance.subscribeOnOpponentTimeOut(onOpponentTimeOut);
    wsClientInstance.subscribeOnYourTimeOut(onMyTimeOut);
    return () => {
      wsClientInstance.unsubscribeOnOpponentDisconnected(
        onOpponentDisconnected
      );
      wsClientInstance.unsubscribeOnWinEvent(onWin);
      wsClientInstance.unsubscribeOnLostEvent(onLost);
      wsClientInstance.unsubscribeOnWaitingForOpponent(onInQueue);
      wsClientInstance.unsubscribeOnGameStarted(onGameFound);
      wsClientInstance.unsubscribeOnOpponentSurrender(onOpponentSurrender);
      wsClientInstance.unsubscribeOnSurrenderConfirmed(onSurrenderConfirmed);
      wsClientInstance.subscribeOnOpponentTimeOut(onOpponentTimeOut);
      wsClientInstance.subscribeOnYourTimeOut(onMyTimeOut);
    };
  }, []);

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
  const gameInProgress =
    onlyBoardVisible &&
    !isWon &&
    !isLost &&
    !isMeSurrender &&
    !isOpponentSurrender;

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-5 sm:p-5 font-[family-name:var(--font-geist-sans)]">
      {showFindButton && (
        <button
          onClick={findGame}
          className="bg-[#f5f5f5] text-[#333] px-4 py-2 rounded-lg shadow-md"
        >
          Find Game
        </button>
      )}
      <GameStatusBar
        isConnected={isConnected}
        showOponentDisconnected={showOponentDisconnected}
        showInQueueMessage={showInQueueMessage}
        showWinMessage={isWon}
        showOpponentWon={isLost}
        showOpponentSurrender={isOpponentSurrender}
        showMySurrender={isMeSurrender}
        showMyTimeOut={myTimeOut}
        showOpponentTimeOut={opponentTimeOut}
      />
      {onlyBoardVisible && (
        <React.Fragment>
          {/* Add stalemate handling */}
          {gameInProgress && (
            <TurnInfoComponent myColor={gameData.gameInfo.yourColor} />
          )}
          <DynamicGameComponent gameData={gameData} />
          {gameInProgress && <SurrenderButton />}
        </React.Fragment>
      )}
    </div>
  );
}
GamePage.strictMode = false;
