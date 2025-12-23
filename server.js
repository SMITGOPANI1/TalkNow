const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;
const pairs = new Map(); // socket.id -> peer.id

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("find-peer", () => {
    if (waitingUser && waitingUser !== socket.id) {
      const peerId = waitingUser;

      // pair
      pairs.set(socket.id, peerId);
      pairs.set(peerId, socket.id);

      socket.emit("peer-found", {
        peerId,
        initiator: true
      });

      io.to(peerId).emit("peer-found", {
        peerId: socket.id,
        initiator: false
      });

      waitingUser = null;
    } else {
      waitingUser = socket.id;
    }
  });

  // WebRTC signaling
  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", {
      from: socket.id,
      data
    });
  });

  // CHAT (unchanged, your working logic)
  socket.on("chat-message", ({ message }) => {
    const peerId = pairs.get(socket.id);
    if (peerId) {
      io.to(peerId).emit("chat-message", { message });
    }
  });

  // ✅ NEW: HANDLE NEXT / LEAVE
  socket.on("leave-peer", () => {
    const peerId = pairs.get(socket.id);

    if (peerId) {
      // break pair
      pairs.delete(peerId);
      pairs.delete(socket.id);

      // notify peer
      io.to(peerId).emit("peer-left");

      // 🔁 peer auto-searches again
      io.to(peerId).emit("auto-find");
    }

    // current user searches again
    waitingUser = null;
  });

  socket.on("disconnect", () => {
    const peerId = pairs.get(socket.id);

    if (peerId) {
      pairs.delete(peerId);
      io.to(peerId).emit("peer-left");
      io.to(peerId).emit("auto-find");
    }

    pairs.delete(socket.id);

    if (waitingUser === socket.id) {
      waitingUser = null;
    }

    console.log("Disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
