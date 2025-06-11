const { Builder, By, Key,until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
let options = new chrome.Options();

(async function extractTitle() {
  // Launch Chrome browser
//   let driver = await new Builder().forBrowser('chrome').build();
let driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options.addArguments('--headless=new'))
  .build();

  try {
    // Go to the URL
    await driver.get('https://flask.io/');
    const textELEM = await driver.findElement(By.xpath("/html/body/div[2]/div[1]/div/h1"));
    const text = await textELEM.getText();
    // const button = await driver.findElement(By.xpath('/html/body/div[1]/div/nav/a'));

    
    // Wait until the title element is present
    // await button.click()
    
    // const inputField = await driver.wait(until.elementLocated(By.xpath('/html/body/div[2]/form/div[1]/input')), 10000);
    // await inputField.sendKeys('test@gmail.com');

    // const inputField2 = await driver.wait(until.elementLocated(By.xpath('/html/body/div[2]/form/div[2]/input')), 10000);
    // await inputField2.sendKeys('simulation',Key.RETURN);


    // Get the element and extract text
    // const linkElement = await driver.findElement(By.css('h1.title a'));
    // const linkText = await linkElement.getText();

    console.log('Extracted Title:', text);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // await driver.quit();
  }
})();
