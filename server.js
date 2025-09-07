const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("location-update", (payload) => {
    console.log("Location received:", payload);
  });

  socket.on("audio-chunk", (chunk) => {
    console.log("Audio chunk received, length:", chunk.length);
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
