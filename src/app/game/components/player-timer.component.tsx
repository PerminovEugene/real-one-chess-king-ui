"use client";

import React, { useEffect } from "react";
import { TimerComponent } from "./timer.component";
import wsClientInstance from "../../../socket/index";

type OpponentTimerProps = {
  timeLeft: number;
  initialIsActive: boolean;
  activeOnMyTurn: boolean;
};

export function PlayerTimerComponent({
  timeLeft,
  initialIsActive,
  activeOnMyTurn,
}: OpponentTimerProps) {
  const [isActive, setIsActive] = React.useState(initialIsActive);

  useEffect(() => {
    const onOpponentTurn = () => {
      setIsActive(activeOnMyTurn);
    };
    const onTurnConfirmed = () => {
      setIsActive(!activeOnMyTurn);
    };
    const onGameEnd = () => {
      setIsActive(false);
    };

    wsClientInstance.subscribeOnOpponentTurn(onOpponentTurn);
    wsClientInstance.subscribeOnTurnConfirmed(onTurnConfirmed);

    wsClientInstance.subscribeOnWinEvent(onGameEnd);
    wsClientInstance.subscribeOnLostEvent(onGameEnd);
    wsClientInstance.subscribeOnOpponentSurrender(onGameEnd);
    wsClientInstance.subscribeOnSurrenderConfirmed(onGameEnd);
    wsClientInstance.subscribeOnOpponentDisconnected(onGameEnd);
    wsClientInstance.subscribeOnOpponentTimeOut(onGameEnd);
    wsClientInstance.subscribeOnYourTimeOut(onGameEnd);

    return () => {
      wsClientInstance.unsubscribeOnOpponentTurn(onOpponentTurn);
      wsClientInstance.unsubscribeOnTurnConfirmed(onTurnConfirmed);

      wsClientInstance.unsubscribeOnWinEvent(onGameEnd);
      wsClientInstance.unsubscribeOnLostEvent(onGameEnd);
      wsClientInstance.unsubscribeOnOpponentSurrender(onGameEnd);
      wsClientInstance.unsubscribeOnSurrenderConfirmed(onGameEnd);
      wsClientInstance.unsubscribeOnOpponentDisconnected(onGameEnd);
      wsClientInstance.unsubscribeOnOpponentTimeOut(onGameEnd);
      wsClientInstance.unsubscribeOnYourTimeOut(onGameEnd);
    };
  }, []);

  return <TimerComponent timeLeft={timeLeft} isActive={isActive} />;
}
