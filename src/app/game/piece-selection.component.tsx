"use client";

import React, { useEffect, useState } from "react";
import { UiEvent } from "./events";
import { PieceType } from "@real_one_chess_king/game-logic";

export default function PieceSelectionComponent({
  userActionsEventEmitter,
}: {
  userActionsEventEmitter: EventTarget;
}) {
  const [isVisible, setVisibility] = useState(false);
  const [pieceTypes, setPieceTypes] = useState<PieceType[]>([]);

  useEffect(() => {
    const callback = (event: unknown) => {
      setVisibility(true);
      const {
        detail: { pieceTypes },
      } = event as { detail: { pieceTypes: PieceType[] } };
      setPieceTypes(pieceTypes);
    };
    userActionsEventEmitter.addEventListener(
      UiEvent.ShowTransformationOptions,
      callback
    );
    return () => {
      userActionsEventEmitter.removeEventListener(
        UiEvent.ShowTransformationOptions,
        callback
      );
    };
  }, [userActionsEventEmitter]);

  const setSelectedPiece = (pieceType: PieceType) => {
    userActionsEventEmitter.dispatchEvent(
      new CustomEvent(UiEvent.TransformationPieceTypeSelected, {
        detail: { pieceType },
      })
    );
    setVisibility(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* BACKDROP (optional): slight transparent background to dim the rest */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />

      {/* CASTLE POPUP */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Castle container */}
        <div className="relative w-80 h-96 bg-gray-300 border-4 border-gray-700 rounded-b-lg shadow-lg overflow-hidden">
          {/* Left turret */}
          <div
            className="absolute top-0 left-0 w-10 h-14 bg-gray-700"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 50%, 66.66% 50%, 66.66% 100%, 33.33% 100%, 33.33% 50%, 0 50%)",
            }}
          />

          {/* Right turret */}
          <div
            className="absolute top-0 right-0 w-10 h-14 bg-gray-700"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 50%, 66.66% 50%, 66.66% 100%, 33.33% 100%, 33.33% 50%, 0 50%)",
            }}
          />

          {/* Title */}
          <h2 className="mt-4 text-center text-lg font-semibold text-gray-800">
            Choose a Piece
          </h2>

          {/* Buttons fill vertical space */}
          <ul className="absolute top-14 bottom-14 left-4 right-4 flex flex-col space-y-2">
            {pieceTypes.map((pieceType, index) => (
              <li key={`${pieceType}-${index}`} className="flex-1">
                <button
                  className="w-full h-full bg-gray-700 text-white rounded hover:bg-gray-600 transition flex items-center justify-center"
                  onClick={() => setSelectedPiece(pieceType)}
                >
                  {pieceType.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>

          {/* Castle door at bottom */}
          {/* <div className="absolute bottom-0 inset-x-1/3 w-1/3 h-16 bg-gray-700 rounded-t-lg" /> */}
        </div>
      </div>
    </>
  );
}
