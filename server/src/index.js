const { Client, RemoteAuth } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

require("dotenv").config({
  debug: true,
  path: "./src/.env",
});

const app = express();

app.use(express.json());
app.use(cors("*"));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const store = new MongoStore({ mongoose: mongoose });

const client = new Client({
  authStrategy: new RemoteAuth({
    store: store,
    backupSyncIntervalMs: 300000,
  }),
  puppeteer: {
    headless: true,
  },
});

// Load the session data
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    client.initialize();
  })
  .catch((error) => {
    console.error(error);
  });

io.on("connection", (socket) => {
  socket.broadcast.emit("socket_connected", `Conectado al socket ${socket.id}`);
});

app.get("/getChats", (req, res) => {
  client
    .getChats()
    .then((chats) => {
      res.send(chats);
    })
    .catch(() => ({ message: "Error al obtener chats" }));
});

app.get("/getChatBydId", async (req, res) => {
  const response = await client
    .getChatById(req.query.chatId)
    .then((chat) => chat)
    .catch((error) => {
      console.log(error);
      return { message: "Ha ocurrido un error al obtener la conversación" };
    });

  if ("message" in response) {
    return response.message;
  }

  const messages = await response.fetchMessages({ limit: Infinity });

  return res.send({
    ...response,
    messages: messages.map(({ id, body, fromMe, timestamp }) => ({
      id,
      body,
      fromMe,
      timestamp,
    })),
  });
});

app.post("/sendMessage", async (req, res) => {
  console.log(req.body);

  const { message, chatId } = req.body;

  const messageResponse = await client.sendMessage(chatId, message);

  console.log("messageResponse", messageResponse);

  return res.send({
    message,
  });
});

app.post("/logout", (req, res) => {
  client
    .logout()
    .then(() => {
      res
        .status(200)
        .json({ message: "Se ha cerrado la sesión correctamente" });
    })
    .catch((error) => {
      console.log(error);
      res
        .status(500)
        .json({ message: "Ha ocurrido un error al cerrar la sesión" });
    });
});

/* app.get("/getContacts", (req, res) => {
  client.getContacts().then((contacts) => {
    res.send(contacts);
  });
}); */

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});

client.on("ready", () => {
  console.log("Sesión iniciada");
  io.emit("ready", "Listo para empezar");
});

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  io.emit("qr_received", qr);
});

client.on("authenticated", () => {
  io.emit("authenticated", "Autenticado");
});

client.on("remote_session_saved", () => {
  // Do Stuff...
  console.log("Sesión remota guardada correctamente");
  io.emit("remote_session_saved", "Sesión remota guardada correctamente");
});
