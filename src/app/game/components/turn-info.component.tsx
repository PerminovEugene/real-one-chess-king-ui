"use client";

import React, { useEffect } from "react";
import { Color, reverseColor } from "@real_one_chess_king/game-logic";
import wsClientInstance from "../../../socket/index";

const TurnInfoComponent = ({ myColor }: { myColor: Color }) => {
  const [currentTurnColor, setCurrentTurnColor] = React.useState<Color>(
    Color.white
  );
  const opponentColor = reverseColor(myColor);

  useEffect(() => {
    const onOpponentTurn = () => {
      setCurrentTurnColor(myColor);
    };
    const onTurnConfirmed = () => {
      setCurrentTurnColor(opponentColor);
    };

    wsClientInstance.subscribeOnOpponentTurn(onOpponentTurn);
    wsClientInstance.subscribeOnTurnConfirmed(onTurnConfirmed);

    return () => {
      wsClientInstance.unsubscribeOnOpponentTurn(onOpponentTurn);
      wsClientInstance.unsubscribeOnTurnConfirmed(onTurnConfirmed);
    };
  }, []);

  const isMyturn = currentTurnColor === myColor;

  return <div>{isMyturn ? <p>Your turn</p> : <p>Opponent&apos;s turn</p>}</div>;
};

export default TurnInfoComponent;
