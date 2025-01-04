"use client";

import { formatMillisecondsToMMSS } from "@/app/utils/time";
import React, { useEffect, useState } from "react";

type TimerProps = {
  timeLeft: number;
  isActive: boolean;
};

const second = 1000;

export function TimerComponent({ timeLeft, isActive }: TimerProps) {
  const [counter, setCounter] = useState(timeLeft);
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (isActive) {
      intervalId = setInterval(() => {
        setCounter((prevCounter) => prevCounter - second);
      }, second);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, timeLeft]);

  return <div>{formatMillisecondsToMMSS(counter)}</div>;
}
