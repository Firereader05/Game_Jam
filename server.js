// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

// Allow CORS (adjust origins in production as needed)
app.use(cors());

// (Optional) Serve static files from the "public" directory
app.use(express.static("public"));

// A basic route for testing
app.get("/", (req, res) => {
  res.send("Socket.io Game Jam Server is running on Render!");
});

// Create the HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // You can lock this down in production
    methods: ["GET", "POST"],
  },
});

// Global variable to store game uploads (shared across all clients)
let uploads = [];

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a client requests data, send current uploads
  socket.on("requestData", () => {
    socket.emit("sendData", uploads);
  });

  // When a client updates data, store and broadcast it
  socket.on("updateData", (data) => {
    uploads = data;
    io.emit("sendData", uploads);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Use process.env.PORT provided by Render or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
