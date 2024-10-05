const { Client, RemoteAuth, MessageMedia } = require("whatsapp-web.js");
const { MongoStore } = require("wwebjs-mongo");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const { createServer } = require("node:http");
const cors = require("cors");
const express = require("express");
const fileTypeChecker = require("file-type-checker");

require("dotenv").config({
  debug: true,
  path: "./src/.env",
});

const app = express();

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
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
    headless: false,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-dev-shm-usage",
    ],
  },
});

const exampleImageUrl = "https://via.placeholder.com/350x150.png";

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
      res.json(chats);
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

  return res.json({
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
  const { message, chatId, mimetype } = req.body;

  if (mimetype) {
    const media = await MessageMedia.fromUrl(exampleImageUrl, {
      unsafeMime: true,
    });

    try {
      const response = await client.sendMessage(chatId, "Imagen enviada", {
        caption: "Imagen enviada",
        media: {
          data: media.data,
          mimetype: media.mimetype,
          filename: media.filename,
          filesize: null,
        },
        sendMediaAsDocument: true,
      });

      console.log(response);

      return res.status(200).json({ message: "Archivo enviado" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error al enviar archivo" });
    }
  }

  const messageResponse = await client.sendMessage(chatId, message);

  console.log("messageResponse", messageResponse);

  return res.json({
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
    res.json(contacts);
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
