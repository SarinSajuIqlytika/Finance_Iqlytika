const WebSocket = require("ws");

// Replace these with actual values from your Dhan account
const TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJwYXJ0bmVySWQiOiIiLCJkaGFuQ2xpZW50SWQiOiIyNTA2MDk0NDIxIiwid2ViaG9va1VybCI6IiIsImlzcyI6ImRoYW4iLCJleHAiOjE3NDk3MjMzMzF9.wpRFBrT0Ru8AugREpXen24aswMnaB1M7Voj8HoEwqC0EtNiy7N7NUEgCRpavQLygRsHRILcshRyRCUmIHBy5JQ"; // access token
const CLIENT_ID = "2506094421"; 
const AUTH_TYPE = 2; 
const VERSION = 2; 

const WS_URL = `wss://api-feed.dhan.co?version=${VERSION}&token=${TOKEN}&clientId=${CLIENT_ID}&authType=${AUTH_TYPE}`;

// Connect to WebSocket
const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ WebSocket connection established.");

  // Subscribe to instruments
  const subscribeMsg = {
    RequestCode: 15,
    InstrumentCount: 2,
    InstrumentList: [
      {
        ExchangeSegment: "NSE_EQ",
        SecurityId: "1333", // Replace with actual ID (e.g., Infosys)
      },
      {
        ExchangeSegment: "BSE_EQ",
        SecurityId: "532540", // Replace with actual ID
      },
    ],
  };

  ws.send(JSON.stringify(subscribeMsg));
  console.log("📩 Subscription message sent.");
});

// Parse binary message
ws.on("message", (data) => {
  const buffer = Buffer.from(data);

  const feedCode = buffer.readUInt8(0);

  switch (feedCode) {
    case 2:
      parseTickerPacket(buffer);
      break;
    case 4:
      parseQuotePacket(buffer);
      break;
    case 5:
      parseOIPacket(buffer);
      break;
    case 6:
      parsePrevClosePacket(buffer);
      break;
    case 8:
      parseFullPacket(buffer);
      break;
    case 50:
      console.warn("⚠️ Feed disconnected:", buffer.readUInt16BE(9));
      break;
    default:
      console.warn("⚠️ Unknown feed code:", feedCode);
  }
});

// Ticker Packet (code 2)
function parseTickerPacket(buf) {
  const ltp = buf.readFloatLE(8);
  const ltt = buf.readInt32LE(12);

  console.log("📊 Ticker Update => LTP:", ltp, "| LTT:", new Date(ltt * 1000).toLocaleTimeString());
}

// Quote Packet (code 4)
function parseQuotePacket(buf) {
  const ltp = buf.readFloatLE(8);
  const qty = buf.readInt16LE(12);
  const ltt = buf.readInt32LE(14);
  const atp = buf.readFloatLE(18);
  const vol = buf.readInt32LE(22);
  const sellQty = buf.readInt32LE(26);
  const buyQty = buf.readInt32LE(30);
  const open = buf.readFloatLE(34);
  const close = buf.readFloatLE(38);
  const high = buf.readFloatLE(42);
  const low = buf.readFloatLE(46);

  console.log("📈 Quote Update:");
  console.table({ ltp, qty, ltt: new Date(ltt * 1000).toLocaleTimeString(), atp, vol, sellQty, buyQty, open, close, high, low });
}

// OI Packet (code 5)
function parseOIPacket(buf) {
  const oi = buf.readInt32LE(8);
  console.log("📌 Open Interest:", oi);
}

// Previous Close Packet (code 6)
function parsePrevClosePacket(buf) {
  const prevClose = buf.readFloatLE(8);
  const oi = buf.readInt32LE(12);
  console.log("📉 Previous Close:", prevClose, "| Previous OI:", oi);
}

// Full Data Packet (code 8)
function parseFullPacket(buf) {
  const ltp = buf.readFloatLE(8);
  const qty = buf.readInt16LE(12);
  const ltt = buf.readInt32LE(14);
  const atp = buf.readFloatLE(18);
  const vol = buf.readInt32LE(22);
  const sellQty = buf.readInt32LE(26);
  const buyQty = buf.readInt32LE(30);
  const oi = buf.readInt32LE(34);
  const highOi = buf.readInt32LE(38);
  const lowOi = buf.readInt32LE(42);
  const open = buf.readFloatLE(46);
  const close = buf.readFloatLE(50);
  const high = buf.readFloatLE(54);
  const low = buf.readFloatLE(58);

  console.log("📊 Full Data Packet:");
  console.table({ ltp, qty, ltt: new Date(ltt * 1000).toLocaleTimeString(), atp, vol, sellQty, buyQty, oi, highOi, lowOi, open, close, high, low });
}

// Keep alive check
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 10000); // every 10s as per Dhan docs

// Handle errors
ws.on("error", (err) => {
  console.error("❌ WebSocket Error:", err.message);
});

ws.on("close", (code, reason) => {
  console.warn(`🔌 WebSocket closed. Code: ${code}, Reason: ${reason}`);
});
