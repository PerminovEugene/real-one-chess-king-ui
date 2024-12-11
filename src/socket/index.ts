import {
  Turn,
  WSClientGameEvent,
  WSServerGameEvent,
} from "@real_one_chess_king/game-logic";
import { io, Socket } from "socket.io-client";

let socket: Socket;

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

  sendFindGame(onGameFound: Function, onInQueue: Function) {
    console.log("send find game");
    socket.on(WSServerGameEvent.GameStarted, (data) => {
      console.log("game found", data);
      onInQueue(false);
      onGameFound(data);
      socket.off(WSServerGameEvent.WaitingForOpponent);
      socket.off(WSServerGameEvent.GameStarted);
    });
    socket.on(WSServerGameEvent.WaitingForOpponent, () => {
      console.log("in queue");
      onInQueue(true);
      // socket.off(WSServerGameEvent.WaitingForOpponent);
      // socket.off(WSServerGameEvent.GameStarted);
    });
    socket.emit(WSClientGameEvent.FindGame, { name: "player" + Math.random() });
  }

  subscribeOnOpponentTurn(updateBoard: (turn: Turn) => void) {
    socket.on(WSServerGameEvent.OpponentTurn, (data) => {
      updateBoard(data);
    });
  }

  subscribeOnOpponentDisconnected(onOpponentDisconnect: Function) {
    console.log("Opponent disconnect");
    socket.on(WSServerGameEvent.OpponentDisconnected, (data) => {
      onOpponentDisconnect();
    });
  }

  sendTurn(turn: Turn) {
    socket.emit(WSClientGameEvent.Turn, turn);
  }

  subscribe() {}
}
const instance = new WSClient();
export default instance;
