"use client";

import React, { useEffect } from "react";
import { TimerComponent } from "./timer.component";
import wsClientInstance from "../../../socket/index";

type OpponentTimerProps = {
  timeLeft: number;
  initialIsActive: boolean;
  activeOnMyTurn: boolean;
  timeStart: string;
};

export function PlayerTimerComponent({
  timeLeft,
  initialIsActive,
  activeOnMyTurn,
  timeStart,
}: OpponentTimerProps) {
  const [isActive, setIsActive] = React.useState(initialIsActive);
  const [isCountdown, setCountdown] = React.useState(true);
  const expectedStart = new Date(timeStart);
  const beforeStart = expectedStart.getTime() - new Date().getTime();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (beforeStart > 0) {
      setCountdown(true);
      timer = setTimeout(() => {
        setCountdown(false);
      }, beforeStart);
    } else {
      setCountdown(false);
    }

    const onOpponentTurn = () => {
      setIsActive(activeOnMyTurn);
    };
    const onTurnConfirmed = () => {
      setIsActive(!activeOnMyTurn);
    };
    const onGameEnd = () => {
      setTimeout(() => {
        setIsActive(false);
      }, 1000);
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
      clearTimeout(timer);
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

  return isCountdown && isActive ? (
    <TimerComponent
      key="countdown"
      timeLeft={beforeStart}
      isActive={isActive}
    />
  ) : (
    <TimerComponent key="timer" timeLeft={timeLeft} isActive={isActive} />
  );
}
