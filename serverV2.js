const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const CACHE_FILE = path.join(__dirname, "stock_cache.json");

// Load cached result from file (if exists)
let result = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    result = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    console.log("✅ Loaded cache from file.");
  } catch (err) {
    console.error("❌ Failed to read cache file:", err.message);
  }
}

// Save result to file
function saveCacheToFile() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2), "utf-8");
    console.log("💾 Cache saved to file.");
  } catch (err) {
    console.error("❌ Failed to write cache file:", err.message);
  }
}

// User agents for randomization
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:113.0) Gecko/20100101 Firefox/113.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Main scraping function
async function scrapeStockTable(status, exchange) {
  try {
    const URL = `https://money.rediff.com/${status}/${exchange}/daily/groupall`;
    const userAgent = getRandomUserAgent();
    console.log(
      `📡 Scraping ${status.toUpperCase()} from ${exchange.toUpperCase()} - ${userAgent}`
    );
    const { data: html } = await axios.get(URL, {
      headers: {
        "User-Agent": userAgent,
      },
    });

    const $ = cheerio.load(html);
    const results = [];

    $("tbody tr").each((i, row) => {
      try {
        const tds = $(row).find("td");
        if (tds.length < 4) return;

        // Safely extract values
        const companyName = $(tds[0]).text()?.trim() || null;
        const prevClose =
          exchange === "nse"
            ? $(tds[1]).text()?.trim() || null
            : $(tds[2]).text()?.trim() || null;
        const currentPrice =
          exchange === "nse"
            ? $(tds[2]).text()?.trim() || null
            : $(tds[3]).text()?.trim() || null;
        const percentChangeRaw =
          exchange === "nse"
            ? $(tds[3]).text()?.trim() || null
            : $(tds[4]).text()?.trim() || null;
        const percentChange = percentChangeRaw;

        const obj = {
          companyName,
          prevClose,
          currentPrice,
          percentChange,
        };

        // If any value is null or empty, skip this row
        const hasAllValidValues = Object.values(obj).every(
          (val) => val && val !== "-"
        );
        if (hasAllValidValues) {
          results.push(obj);
        }
      } catch (err) {
        console.warn(`⚠️ Skipped row ${i} due to error:`, err.message);
      }
    });

    // console.log(results);
    return results || [];
  } catch (error) {
    console.error("❌ Scraping failed:", error.message);
    return [];
  }
}

// API Endpoint
app.get("/api/stock/top", async (req, res) => {
  const { status, exchange } = req.query;
  const validStatus = ["gainers", "losers"];
  const validExchanges = ["nse", "bse"];

  if (!validExchanges.includes(exchange)) {
    return res.json({
      status: "false",
      message: "Enter a valid exchange: nse or bse",
    });
  }
  if (!validStatus.includes(status)) {
    return res.json({
      status: "false",
      message: "Enter a valid status: gainers or losers",
    });
  }

  const key = `${exchange}_${status}`;
  // console.log(key,result[key].length)
  if (!result[key] || result[key].length == 0) {
    result[key] = await scrapeStockTable(status, exchange);
    saveCacheToFile();
  }

  res.json({ status: "success", count: result[key].length, data: result[key] });
});

async function start() {
  console.log("⏰ Cron triggered at 10:00 AM IST...");
  const tasks = [
    { key: "nse_gainers", args: ["gainers", "nse"] },
    { key: "bse_gainers", args: ["gainers", "bse"] },
    { key: "nse_losers", args: ["losers", "nse"] },
    { key: "bse_losers", args: ["losers", "bse"] },
  ];
  result = {};
  tasks.forEach(({ key, args }) => {
    const randomDelay = Math.floor(Math.random() * 10000);
    setTimeout(async () => {
      console.log(`⚙️ Starting ${key} scrape after ${randomDelay} ms`);
      try {
        result[key] = await scrapeStockTable(...args);
        saveCacheToFile();
        console.log(`✅ Finished ${key} | Count: ${result[key].length}`);
      } catch (err) {
        console.error(`❌ Failed ${key} scrape`, err.message);
      }
    }, randomDelay);
  });
}

// Cron Job – 5:00 PM IST daily
cron.schedule("09 13 * * *", start, {
  timezone: "Asia/Kolkata",
});

// Cron Job – 10:00 AM IST daily
cron.schedule("0 10 * * *", start, {
  timezone: "Asia/Kolkata",
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT} port`);
});
