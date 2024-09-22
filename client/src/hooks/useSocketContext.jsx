import { useContext } from "react";
import { SocketContext } from "../main";

export const useSocketContext = () => {
  const { socket } = useContext(SocketContext);
  return { socket };
};
