// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors()); // allow CORS requests

// Serve static files from a "public" directory (optional)
app.use(express.static("public"));

// Basic root route
app.get("/", (req, res) => {
  res.send("Socket.io Game Jam Server is running!");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"],
  },
});

// Global variable to store game entries
let uploads = [];

// Socket.io connection logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a client requests data, send the current uploads
  socket.on("requestData", () => {
    socket.emit("sendData", uploads);
  });

  // When a client updates the data, save it and broadcast to everyone
  socket.on("updateData", (data) => {
    uploads = data;
    io.emit("sendData", uploads);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Listen on the desired port (e.g., 3003)
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
