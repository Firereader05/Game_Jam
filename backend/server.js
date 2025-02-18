// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Initialize Express app
const app = express();

// Allow Cross-Origin requests (adjust origin in production)
app.use(cors());

// (Optional) Serve static files from "public" folder
// Create a 'public' folder in your project and place your client files there if needed.
app.use(express.static("public"));

// Basic root route
app.get("/", (req, res) => {
  res.send("Socket.io Game Jam Server is running on Render!");
});

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust as necessary for production
    methods: ["GET", "POST"]
  }
});

// Global variable to hold shared game uploads
let uploads = [];

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a client requests the data, send current uploads
  socket.on("requestData", () => {
    socket.emit("sendData", uploads);
  });

  // When a client updates data, store it and broadcast to all
  socket.on("updateData", (data) => {
    uploads = data;
    io.emit("sendData", uploads);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Use Render’s PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
