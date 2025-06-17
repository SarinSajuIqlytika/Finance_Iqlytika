const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
const PORT = 3000;
let result = {
  nse_losers: null,
  nse_gainers: null,
  bse_losers: null,
  bse_gainers: null,
};


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

async function scrapeStockTable(status, exchange) {
  try {
    console.log("FUNCTION CALLED")
    const URL = `https://money.rediff.com/${status}/${exchange}/daily/groupall`;
    const userAgent = getRandomUserAgent();
    const { data: html } = await axios.get(URL, {
      headers: {
        "User-Agent": userAgent,
      },
    });

    const $ = cheerio.load(html);
    const results = [];

    $("tbody tr").each((i, row) => {
      const tds = $(row).find("td");
      if (tds.length < 4) return;

      const companyName = $(tds[0]).text().trim();
      const prevClose = $(tds[1]).text().trim();
      const currentPrice = $(tds[2]).text().trim();
      const percentChangeRaw = $(tds[3]).text().trim();
      const percentChange = parseFloat(percentChangeRaw);

      results.push({
        companyName,
        prevClose: parseFloat(prevClose),
        currentPrice: parseFloat(currentPrice),
        percentChange,
        // changeDirection: percentChange > 0 ? "positive" : percentChange < 0 ? "negative" : "neutral"
      });
    });
    // console.log(results);
    return results;
  } catch (error) {
    console.error("Scraping failed:", error.message);
    return [];
  }
}
let mapper = {
  "nse_gainers":["nse","exchange"]
}

// API endpoint
app.get("/api/stock/top", async (req, res) => {
  let {status,exchange} = req.query;
  let validStatus = ["gainers","losers"];
  let validExchanges = ["nse","bse"];

  if(!validExchanges.includes(exchange)){
    res.json({status:"false",message:"Enter a valid exchange out of nse/bse"})
  }
  if(!validStatus.includes(status)){
    res.json({status:"false",message:"Enter a valid status out of gainers/losers"})
  }

  let key = `${exchange}_${status}`
  
  if (!result[key]) {
    result[key] = await scrapeStockTable(status, exchange);
  } 
  res.json({ status: "success", count: result[key].length, data:result[key]});
});

// Run once daily at 4:10 PM IST
cron.schedule(
  "10 16 * * *",
  async () => {
    console.log("⏰ Cron triggered at 4:10 PM IST...");

    const tasks = [
      { key: "nse_gainers", args: ["gainers", "nse"] },
      { key: "bse_gainers", args: ["gainers", "bse"] },
      { key: "nse_losers", args: ["losers", "nse"] },
      { key: "bse_losers", args: ["losers", "bse"] },
    ];

    tasks.forEach(({ key, args }) => {
      const randomDelay = Math.floor(Math.random() * 10000); // 0 to 9999 ms
      setTimeout(async () => {
        console.log(`⚙️ Starting ${key} scrape after ${randomDelay} ms`);
        try {
          result[key] = await scrapeStockTable(...args);
          console.log(`✅ Finished ${key} | Count: ${result[key].length}`);
        } catch (err) {
          console.error(`❌ Failed ${key} scrape`, err.message);
        }
      }, randomDelay);
    });
  },
  {
    timezone: "Asia/Kolkata",
  }
);






app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
