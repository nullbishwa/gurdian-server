const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve the public dashboard
app.use(express.static(path.join(__dirname, "public")));

// Keep track of clients
const devices = new Set();
const listeners = new Set();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Identify as device or listener
  socket.on("device-register", () => {
    devices.add(socket.id);
    console.log("Device registered:", socket.id);
  });

  socket.on("listener-register", () => {
    listeners.add(socket.id);
    console.log("Listener registered:", socket.id);
  });

  // Receive location updates
  socket.on("location-update", (data) => {
    console.log("Location received from", socket.id, data);
    // Broadcast to all listeners
    listeners.forEach(id => io.to(id).emit("location-update", data));
  });

  // Receive audio chunks
  socket.on("audio-chunk", (chunk) => {
    console.log("Audio chunk received from", socket.id, "size:", chunk.length);
    // Broadcast to all listeners
    listeners.forEach(id => io.to(id).emit("audio-chunk", chunk));
  });

  socket.on("disconnect", () => {
    devices.delete(socket.id);
    listeners.delete(socket.id);
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
