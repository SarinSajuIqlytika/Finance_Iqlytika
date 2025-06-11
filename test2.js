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
const os = require("os");
const path = require("path");
const fs = require("fs");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function scrapeLivePrice(
  ticker = "INFY",
  exchange = "NSE",
  intervalSec = 10
) {
  const url = `https://www.google.com/finance/quote/${ticker}:${exchange}`;

  // Create a unique temporary Chrome user profile directory
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-profile-"));
  const options = new chrome.Options()
    .addArguments("--headless=new")
    .addArguments("--no-sandbox")
    .addArguments("--disable-dev-shm-usage")
    .addArguments(`--user-data-dir=${userDataDir}`);

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(url);

    while (true) {
      try {
        await driver.wait(until.elementLocated(By.css(".YMlKec.fxKbKc")), 10000);

        const priceElement = await driver.findElement(By.css(".YMlKec.fxKbKc"));
        const instrumentElement = await driver.findElement(By.css(".zzDege"));
        const percentDiv = await driver.findElement(By.css(".enJeMd .zWwE1 .JwB6zf"));
        const color = await percentDiv.getCssValue("color");

        let status = null;
        if (color === "rgba(165, 14, 14, 1)") status = "low";
        else if (color === "rgba(19, 115, 51, 1)") status = "high";

        const low = await percentDiv.getText();
        const price = await priceElement.getText();
        const instrumentName = await instrumentElement.getText();

        console.log(
          `[${new Date().toLocaleTimeString()}] ${instrumentName} price: ${price} ${status || ""} ${low}`
        );
      } catch (err) {
        console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Failed to get price: ${err.message}`);
      }

      await new Promise((res) => setTimeout(res, intervalSec * 1000));
      await driver.navigate().refresh();
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await driver.quit();
    // Optional: Clean up the temp profile
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

scrapeLivePrice("INFY", "NSE", 10);

