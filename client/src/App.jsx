import { HomeScreen } from "./screens/home";
import { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import { createContext } from "react";
import "./App.css";

const socket = io("http://localhost:4000");
export const SocketContext = createContext({ socket });

function App() {
  return (
    <SocketContext.Provider value={{ socket }}>
      <Toaster></Toaster>
      <HomeScreen />
    </SocketContext.Provider>
  );
}

export default App;
