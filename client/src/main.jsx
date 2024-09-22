import App from "./App.jsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatScreen } from "./screens/chat/index.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import { createContext } from "react";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App></App>,
  },
  {
    path: "/chat",
    element: <ChatScreen></ChatScreen>,
  },
]);

const queryClient = new QueryClient();

const socket = io("http://localhost:4000");
export const SocketContext = createContext({ socket });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketContext.Provider value={{ socket }}>
        <Toaster></Toaster>
        <RouterProvider router={router}></RouterProvider>
      </SocketContext.Provider>
    </QueryClientProvider>
  </StrictMode>
);
