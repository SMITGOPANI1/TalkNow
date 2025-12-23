// const socket = io();

// const startBtn = document.getElementById("startBtn");
// const nextBtn = document.getElementById("nextBtn");
// const stopBtn = document.getElementById("stopBtn");

// const localVideo = document.getElementById("localVideo");
// const remoteVideo = document.getElementById("remoteVideo");

// const msgInput = document.getElementById("msgInput");
// const sendBtn = document.getElementById("sendBtn");
// const messages = document.getElementById("messages");

// let localStream;
// let peer;
// let peerId;

// const rtcConfig = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" }
//   ]
// };

// /* START */
// startBtn.onclick = async () => {
//   localStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true
//   });

//   localVideo.srcObject = localStream;
//   startBtn.disabled = true;
//   nextBtn.disabled = false;
//   stopBtn.disabled = false;

//   socket.emit("find-peer");
// };

// /* NEXT */
// nextBtn.onclick = () => {
//   socket.emit("leave-peer"); // ✅ ADD THIS
//   cleanup();
//   socket.emit("find-peer");
// };
// // Auto-search when server tells you


// // nextBtn.onclick = () => {
// //   cleanup();
// //   socket.emit("find-peer");
// // };

// // Auto-search when server tells you

// socket.on("auto-find", () => {
//   cleanup();
//   socket.emit("find-peer");
// });


// /* STOP */
// stopBtn.onclick = () => {
//   cleanup(true);
// };

// /* MATCH */
// socket.on("peer-found", async ({ peerId: id, initiator }) => {
//   peerId = id;
//   addMsg("System", "Stranger connected");

//   peer = new RTCPeerConnection(rtcConfig);

//   localStream.getTracks().forEach(track =>
//     peer.addTrack(track, localStream)
//   );

//   peer.ontrack = (e) => {
//     remoteVideo.srcObject = e.streams[0];
//   };

//   peer.onicecandidate = (e) => {
//     if (e.candidate) {
//       socket.emit("signal", {
//         to: peerId,
//         data: { candidate: e.candidate }
//       });
//     }
//   };

//   if (initiator) {
//     const offer = await peer.createOffer();
//     await peer.setLocalDescription(offer);
//     socket.emit("signal", {
//       to: peerId,
//       data: { sdp: peer.localDescription }
//     });
//   }
// });

// /* SIGNAL */
// socket.on("signal", async ({ data }) => {
//   if (!peer) return;

//   if (data.sdp) {
//     await peer.setRemoteDescription(data.sdp);
//     if (data.sdp.type === "offer") {
//       const answer = await peer.createAnswer();
//       await peer.setLocalDescription(answer);
//       socket.emit("signal", {
//         to: peerId,
//         data: { sdp: peer.localDescription }
//       });
//     }
//   }

//   if (data.candidate) {
//     await peer.addIceCandidate(data.candidate);
//   }
// });

// /* ✅ CHAT — NOW GUARANTEED */
// sendBtn.onclick = () => {
//   if (!msgInput.value || !peerId) return;

//   addMsg("Me", msgInput.value);
//   socket.emit("chat-message", { message: msgInput.value });
//   msgInput.value = "";
// };
// msgInput.addEventListener("keydown", (e) => {
//   // Enter without Shift → send
//   if (e.key === "Enter" && !e.shiftKey) {
//     e.preventDefault();
//     sendBtn.click();
//   }
// });


// socket.on("chat-message", ({ message }) => {
//   addMsg("Stranger", message);
// });

// /* PEER LEFT */
// socket.on("peer-left", () => {
//   addMsg("System", "Stranger left");
//   cleanup();
// });

// /* CLEANUP */
// function cleanup(stopCamera = false) {
//   if (peer) {
//     peer.close();
//     peer = null;
//   }

//   remoteVideo.srcObject = null;
//   peerId = null;

//   if (stopCamera && localStream) {
//     localStream.getTracks().forEach(t => t.stop());
//     localVideo.srcObject = null;
//     startBtn.disabled = false;
//     nextBtn.disabled = true;
//     stopBtn.disabled = true;
//   }
// }

// function addMsg(sender, text) {
//   messages.innerHTML += `<div><b>${sender}:</b> ${text}</div>`;
//   messages.scrollTop = messages.scrollHeight;
// }
const socket = io();
let isConnected = false;
const statusOverlay = document.getElementById("statusOverlay");



const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const stopBtn = document.getElementById("stopBtn");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

let localStream;
let peer;
let peerId;

function showSearching() {
  statusOverlay.classList.remove("hidden");
  statusOverlay.innerText = "Finding connection…";
}

function hideSearching() {
  statusOverlay.classList.add("hidden");
}


const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

/* START */
startBtn.onclick = async () => {
    showSearching();

  startBtn.disabled = true;
  nextBtn.disabled = true;   // ❌ cannot next before connect
  stopBtn.disabled = false;

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;

  socket.emit("find-peer"); // ✅ auto search
};


/* NEXT */
nextBtn.onclick = () => {
    showSearching();

  if (!isConnected) return; // safety

  socket.emit("leave-peer");
  isConnected = false;
  nextBtn.disabled = true;

  cleanup();
  socket.emit("find-peer");
};

// Auto-search when server tells you


// nextBtn.onclick = () => {
//   cleanup();
//   socket.emit("find-peer");
// };

// Auto-search when server tells you

socket.on("auto-find", () => {
    showSearching();

  isConnected = false;
  nextBtn.disabled = true;

  cleanup();
  socket.emit("find-peer");
});



/* STOP */
stopBtn.onclick = () => {
    statusOverlay.classList.add("hidden");

  socket.emit("leave-peer");

  isConnected = false;
  nextBtn.disabled = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;

  cleanup(true);
};


/* MATCH */
socket.on("peer-found", async ({ peerId: id, initiator }) => {
    hideSearching();

    isConnected = true;
nextBtn.disabled = false; // ✅ Next enabled ONLY now

  peerId = id;
  addMsg("System", "Stranger connected");

  peer = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track =>
    peer.addTrack(track, localStream)
  );

  peer.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("signal", {
        to: peerId,
        data: { candidate: e.candidate }
      });
    }
  };

  if (initiator) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("signal", {
      to: peerId,
      data: { sdp: peer.localDescription }
    });
  }
});

/* SIGNAL */
socket.on("signal", async ({ data }) => {
  if (!peer) return;

  if (data.sdp) {
    await peer.setRemoteDescription(data.sdp);
    if (data.sdp.type === "offer") {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("signal", {
        to: peerId,
        data: { sdp: peer.localDescription }
      });
    }
  }

  if (data.candidate) {
    await peer.addIceCandidate(data.candidate);
  }
});

/* ✅ CHAT — NOW GUARANTEED */
sendBtn.onclick = () => {
  if (!msgInput.value || !peerId) return;

  addMsg("Me", msgInput.value);
  socket.emit("chat-message", { message: msgInput.value });
  msgInput.value = "";
};
msgInput.addEventListener("keydown", (e) => {
  // Enter without Shift → send
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});


socket.on("chat-message", ({ message }) => {
  addMsg("Stranger", message);
});

/* PEER LEFT */
socket.on("peer-left", () => {
    showSearching();

    isConnected = false;
nextBtn.disabled = true;

  addMsg("System", "Stranger left");
  cleanup();
});

/* CLEANUP */
function cleanup(stopCamera = false) {
  if (peer) {
    peer.close();
    peer = null;
  }

  remoteVideo.srcObject = null;
  peerId = null;

  if (stopCamera && localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localVideo.srcObject = null;
    startBtn.disabled = false;
    nextBtn.disabled = true;
    stopBtn.disabled = true;
  }
}

function addMsg(sender, text) {
  messages.innerHTML += `<div><b>${sender}:</b> ${text}</div>`;
  messages.scrollTop = messages.scrollHeight;
}
