// const { Builder, By, until } = require("selenium-webdriver");
// const chrome = require("selenium-webdriver/chrome");
// let options = new chrome.Options();
// async function scrapeLivePrice(
//   ticker = "INFY",
//   exchange = "NSE",
//   intervalSec = 10
// ) {
//   const url = `https://www.google.com/finance/quote/${ticker}:${exchange}`;

//   let driver = await new Builder()
//     .forBrowser("chrome")
//     .setChromeOptions(options.addArguments("--headless=new"))
//     .build();

//   try {
//     await driver.get(url);

//     while (true) {
//       try {
//         // Wait for price element
//         await driver.wait(
//           until.elementLocated(By.css(".YMlKec.fxKbKc")),
//           10000
//         );
//         const priceElement = await driver.findElement(By.css(".YMlKec.fxKbKc"));
//         const instrumentElement = await driver.findElement(By.css(".zzDege"));
//         const percentDiv = await driver.findElement(
//           By.css(".enJeMd .zWwE1 .JwB6zf")
//         );
//         const color = await percentDiv.getCssValue("color");
//         let status = null;
//         if (color == "rgba(165, 14, 14, 1)") {
//           status = "low";
//         } else if (color == "rgba(19, 115, 51, 1)") {
//           status = "high";
//         } else {
//           status = null;
//         }
//         const low = await percentDiv.getText();

//         const price = await priceElement.getText();

//         const instrumentName = await instrumentElement.getText();

//         console.log(
//           `[${new Date().toLocaleTimeString()}] ${instrumentName} price: ${price} ${status} ${low}`
//         );
//       } catch (err) {
//         console.warn(
//           `[${new Date().toLocaleTimeString()}] ⚠️ Failed to get price: ${
//             err.message
//           }`
//         );
//       }

//       // Wait and refresh the page
//       await new Promise((res) => setTimeout(res, intervalSec * 1000));
//       await driver.navigate().refresh();
//     }
//   } catch (err) {
//     console.error("Error:", err.message);
//   } finally {
//     await driver.quit();
//   }
// }

// // Usage: ticker, refresh interval in sec, how many times
// scrapeLivePrice("INFY", "NSE", 10);






// const { Builder, By, until } = require("selenium-webdriver");
// const chrome = require("selenium-webdriver/chrome");
// const fs = require("fs");
// const os = require("os");
// const path = require("path");

// async function scrapeLivePrice(ticker = "INFY", exchange = "NSE", intervalSec = 10) {
//   const url = `https://www.google.com/finance/quote/${ticker}:${exchange}`;

//   // Create a unique temporary user data directory
//   const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-profile-"));

//   let options = new chrome.Options();
//   options.addArguments("--headless=new");
//   options.addArguments(`--user-data-dir=${userDataDir}`);
//   options.addArguments("--no-sandbox"); // Required for EC2/Linux environments
//   options.addArguments("--disable-dev-shm-usage"); // Avoids issues in low-memory environments

//   let driver;
//   try {
//     driver = await new Builder()
//       .forBrowser("chrome")
//       .setChromeOptions(options)
//       .build();

//     await driver.get(url);

//     while (true) {
//       try {
//         // Wait for price element
//         await driver.wait(until.elementLocated(By.css(".YMlKec.fxKbKc")), 10000);
//         const priceElement = await driver.findElement(By.css(".YMlKec.fxKbKc"));
//         const instrumentElement = await driver.findElement(By.css(".zzDege"));
//         const percentDiv = await driver.findElement(By.css(".enJeMd .JwB6zf"));
//         const color = await percentDiv.getCssValue("color");
//         let status = null;
//         if (color === "rgba(165, 14, 14, 1)") {
//           status = "low";
//         } else if (color === "rgba(19, 115, 51, 1)") {
//           status = "high";
//         } else {
//           status = "neutral";
//         }
//         const low = await percentDiv.getText();
//         const price = await priceElement.getText();
//         const instrumentName = await instrumentElement.getText();

//         console.log(
//           `[${new Date().toLocaleTimeString()}] ${instrumentName} price: ${price} ${status} ${low}`
//         );
//       } catch (err) {
//         console.warn(
//           `[${new Date().toLocaleTimeString()}] ⚠️ Failed to get price: ${err.message}`
//         );
//       }

//       // Wait and refresh the page
//       await new Promise((res) => setTimeout(res, intervalSec * 1000));
//       await driver.navigate().refresh();
//     }
//   } catch (err) {
//     console.error("Error:", err.message);
//   } finally {
//     if (driver) {
//       await driver.quit();
//     }
//     // Clean up the temporary user data directory
//     try {
//       fs.rmSync(userDataDir, { recursive: true, force: true });
//     } catch (err) {
//       console.warn(`Failed to delete temp directory ${userDataDir}: ${err.message}`);
//     }
//   }
// }

// // Usage: ticker, exchange, refresh interval in sec
// scrapeLivePrice("INFY", "NSE", 10);





const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeWithCheerio(ticker = "INFY", exchange = "NSE", intervalSec = 10) {
  const url = `https://www.google.com/finance/quote/${ticker}:${exchange}`;

  while (true) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
        },
      });

      const $ = cheerio.load(data);

      const price = $(".YMlKec.fxKbKc").first().text().trim();
      const name = $(".zzDege").first().text().trim();
      const percent = $(".JwB6zf").first().text().trim();

      let status = "neutral";
      if (percent.startsWith("-")) {
        status = "low";
      } else if (percent.startsWith("+") || percent.includes("▲")) {
        status = "high";
      }

      console.log(
        `[${new Date().toLocaleTimeString()}] ${name} price: ${price} ${status} (${percent})`
      );
    } catch (err) {
      console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Error: ${err.message}`);
    }

    // Wait before repeating
    await new Promise((res) => setTimeout(res, intervalSec * 1000));
  }
}

// Run
scrapeWithCheerio("INFY", "NSE", 10);

