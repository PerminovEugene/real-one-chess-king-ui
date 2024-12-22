import {
  Turn,
  WSClientGameEvent,
  WSServerGameEvent,
} from "@real_one_chess_king/game-logic";
import { io, Socket } from "socket.io-client";

let socket: Socket;

type Listener = (...args: any[]) => void;

class WSClient {
  connect() {
    return new Promise<void>((resolve) => {
      const URL =
        process.env.NODE_ENV === "production"
          ? undefined
          : "http://localhost:4000";
      socket = io(URL);

      console.log("begin conection");
      socket.on("connect", () => {
        console.log("connected");
        resolve();
      });
    });
  }

  // subs and unsubs

  subscribeOnGameStarted(onGameStarted: Listener) {
    socket.on(WSServerGameEvent.GameStarted, onGameStarted);
  }
  unsubscribeOnGameStarted(onGameStarted: Listener) {
    socket.off(WSServerGameEvent.GameStarted, onGameStarted);
  }

  subscribeOnWaitingForOpponent(onWaitingForOpponent: Listener) {
    socket.on(WSServerGameEvent.WaitingForOpponent, onWaitingForOpponent);
  }
  unsubscribeOnWaitingForOpponent(onWaitingForOpponent: Listener) {
    socket.off(WSServerGameEvent.WaitingForOpponent, onWaitingForOpponent);
  }

  subscribeOnTurnConfirmed(onTurnConfirmed: () => void) {
    socket.on(WSServerGameEvent.TurnConfirmed, onTurnConfirmed);
  }
  unsubscribeOnTurnConfirmed(listner: Listener) {
    socket.off(WSServerGameEvent.TurnConfirmed, listner);
  }

  subscribeOnOpponentTurn(updateBoard: (turn: Turn) => void) {
    socket.on(WSServerGameEvent.OpponentTurn, updateBoard);
  }
  unsubscribeOnOpponentTurn(listner: Listener) {
    socket.off(WSServerGameEvent.OpponentTurn, listner);
  }

  subscribeOnOpponentDisconnected(onOpponentDisconnect: Listener) {
    socket.on(WSServerGameEvent.OpponentDisconnected, onOpponentDisconnect);
  }
  unsubscribeOnOpponentDisconnected(onOpponentDisconnect: Listener) {
    socket.off(WSServerGameEvent.OpponentDisconnected, onOpponentDisconnect);
  }

  subscribeOnWinEvent(onWin: Listener) {
    socket.on(WSServerGameEvent.YouWon, onWin);
  }
  unsubscribeOnWinEvent(onWin: Listener) {
    socket.off(WSServerGameEvent.YouWon, onWin);
  }

  subscribeOnLostEvent(onLost: Listener) {
    socket.on(WSServerGameEvent.OpponentWon, onLost);
  }
  unsubscribeOnLostEvent(onLost: Listener) {
    socket.off(WSServerGameEvent.OpponentWon, onLost);
  }

  // actions

  sendFindGame() {
    socket.emit(WSClientGameEvent.FindGame, { name: "player" + Math.random() });
  }

  sendTurn(turn: Turn) {
    socket.emit(WSClientGameEvent.Turn, turn);
  }
}
const instance = new WSClient();
export default instance;
