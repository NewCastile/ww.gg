import { useContext } from "react";
import { SocketContext } from "../App";

export const useSocketContext = () => {
  const { socket } = useContext(SocketContext);
  return { socket };
};
