const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Step 1: PORT declared first
const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Optional: serve public folder
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("audio-chunk", (chunk) => {
    socket.broadcast.emit("audio-chunk", chunk);
  });

  socket.on("location-update", (payload) => {
    socket.broadcast.emit("location-update", payload);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Step 2: Listen on PORT
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
