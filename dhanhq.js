const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

function convertDhanTimestampToDate(ts) {
  const istDate = new Date(ts * 1000 + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString()
}
const url = "https://sandbox.dhan.co/v2/charts/intraday";

const body = {
  securityId: "1594",
  exchangeSegment: "NSE_EQ",
  instrument: "EQUITY",
  interval: "1",
  fromDate: "2025-06-12",
  toDate: "2025-06-13",
};

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Access-Token":
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJwYXJ0bmVySWQiOiIiLCJkaGFuQ2xpZW50SWQiOiIyNTA2MDk0NDIxIiwid2ViaG9va1VybCI6IiIsImlzcyI6ImRoYW4iLCJleHAiOjE3NDk3MjMzMzF9.wpRFBrT0Ru8AugREpXen24aswMnaB1M7Voj8HoEwqC0EtNiy7N7NUEgCRpavQLygRsHRILcshRyRCUmIHBy5JQ",
  "Client-Id": "2506094421",
};

// 🧠 Repeatedly fetch and broadcast
async function fetchAndBroadcast() {
  try {
    const response = await axios.post(url, body, { headers });
    const { open, close, low, high, timestamp } = response.data;

    const latestData = {
      open: open.at(-1),
      close: close.at(-1),
      low: low.at(-1),
      high: high.at(-1),
      timestamp: convertDhanTimestampToDate(timestamp.at(-1)),
    //   timestamp: timestamp.at(-1),
    };

    io.emit("liveData", latestData);
    console.log("✅ Sent:", latestData);
  } catch (err) {
    console.error("❌ Error fetching data:", err.response?.data || err.message);
  }
}

// 🔁 Call every 10 seconds
setInterval(fetchAndBroadcast, 10000);

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Live data server running on http://localhost:${PORT}`);
});
