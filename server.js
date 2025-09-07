// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files (listener UI in /public)
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Device registration
  socket.on("device_register", (info) => {
    try {
      const obj = typeof info === "string" ? JSON.parse(info) : info;
      const token = process.env.SHARED_TOKEN || "";
      if (!obj || obj.token !== token) {
        console.log("Invalid token — disconnecting client", socket.id);
        socket.disconnect(true);
        return;
      }
      socket.isDevice = true;
      console.log("Device registered:", obj.device);
    } catch (e) {
      console.log("device_register parse error", e);
    }
  });

  // Listener registration
  socket.on("listener_register", (info) => {
    socket.isListener = true;
    console.log("Listener registered:", socket.id);
  });

  // Forward audio chunks from device → listeners
  socket.on("audio-chunk", (chunk) => {
    socket.broadcast.emit("audio-chunk", chunk);
  });

  // Forward location updates from device → listeners
  socket.on("location-update", (payload) => {
    socket.broadcast.emit("location-update", payload);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
