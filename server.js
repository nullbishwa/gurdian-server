const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow all origins
});

// Serve static files (if you have a web dashboard in /public)
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Receive location from devices
  socket.on("location-update", (payload) => {
    console.log("Location received:", payload);
    // Broadcast to all other clients
    socket.broadcast.emit("location-update", payload);
  });

  // Receive live audio chunks
  socket.on("audio-chunk", (chunk) => {
    console.log("Audio chunk received, length:", chunk.length);
    socket.broadcast.emit("audio-chunk", chunk);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
