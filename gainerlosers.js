const axios = require("axios");
const cheerio = require("cheerio");

const URL = `https://money.rediff.com/losers/nse/daily/groupall`;
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
async function scrapeStockTable() {

  try {
    const userAgent = getRandomUserAgent();
    const { data: html } = await axios.get(URL,{
        headers: {
          "User-Agent": userAgent,
        }});
    const $ = cheerio.load(html);

    const results = [];

    $("tbody tr").each((i, row) => {
      const tds = $(row).find("td");

      const companyName = $(tds[0]).text().trim();
      const prevClose = $(tds[1]).text().trim();
      const currentPrice = $(tds[2]).text().trim();
      const percentChangeRaw = $(tds[3]).text().trim();
      const percentChange = parseFloat(percentChangeRaw);
     if (i==2) return;
      results.push({
        companyName,
        prevClose: parseFloat(prevClose),
        currentPrice: parseFloat(currentPrice),
        percentChange,
        changeDirection: percentChange > 0 ? "positive" : percentChange < 0 ? "negative" : "neutral"
      });
    });

    console.log(results);
  } catch (error) {
    console.error("Scraping failed:", error.message);
  }
}

scrapeStockTable();
