const puppeteer = require('puppeteer');

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  })
}

module.exports = function (RED) {
  function TweetNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const authToken = this.credentials.authToken;
    const browserlessConnection = config.browserlessConnection;

    node.on('input', async function (msg) {
      async function tweet(msg, authToken, browserlessConnection) {
        const browserlessConnectionString = `ws://${browserlessConnection}`;

        const cookies = [{
          'name': 'auth_token',
          'value': authToken,
          'domain': '.twitter.com',
          'path': '/',
          'httpOnly': true,
          'secure': true
        }];

        const message = msg.payload;

        try {
          const browser = await puppeteer.connect({
            browserWSEndpoint: browserlessConnectionString
          });

          const page = await browser.newPage();
          await page.setCookie(...cookies);

          await page.goto('https://twitter.com');
          await page.waitForSelector('div[data-testid="tweetTextarea_0"]');

          await page.type('div[data-testid="tweetTextarea_0"]', message);

          const buttonSelector = 'button[data-testid="tweetButtonInline"]';
          await page.waitForSelector(buttonSelector, { visible: true });

          await page.evaluate((tweetButtonSelector) => {
            document.querySelector(tweetButtonSelector).scrollIntoView();
          }, buttonSelector);

          await page.evaluate((tweetButtonSelector) => {
            document.querySelector(tweetButtonSelector).click();
          }, buttonSelector);

          await page.click(buttonSelector);

          await delay(5000);

          await browser.close();

          node.status({});
        } catch (err) {
          node.error(err, msg);
          node.status({
            fill: "red",
            shape: "ring",
            text: "twitter.status.failed"
          })
        }
      }

      await tweet(msg, authToken, browserlessConnection);
    });

  }
  RED.nodes.registerType("tweet", TweetNode, {
    credentials: {
      authToken: { type: "password" }
    }
  });
}