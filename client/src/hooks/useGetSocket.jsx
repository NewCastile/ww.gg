import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useGetSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("ready", () => {
      setSocket(socket);
    });
  }, []);

  return { socket, setSocket };
};
