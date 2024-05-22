const puppeteer = require('puppeteer');

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  })
}

module.exports = function (RED) {
  function DirectMessageNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const authToken = this.credentials.authToken;
    const browserlessConnection = config.browserlessConnection;

    node.on('input', async function (msg) {
      async function directMessage(msg, authToken, browserlessConnection) {
        const browserlessConnectionString = `ws://${browserlessConnection}`;

        const cookies = [{
          'name': 'auth_token',
          'value': authToken,
          'domain': '.twitter.com',
          'path': '/',
          'httpOnly': true,
          'secure': true
        }];

        const message = msg.payload.message;
        const users = msg.payload.users;

        try {
          const browser = await puppeteer.connect({
            browserWSEndpoint: browserlessConnectionString
          });

          const page = await browser.newPage();
          await page.setCookie(...cookies);

          await page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });

          const dmSelector = 'a[data-testid="AppTabBar_DirectMessage_Link"]';
          await page.waitForSelector(dmSelector);

          await page.evaluate(selector => {
            document.querySelector(selector).click();
          }, dmSelector);

          const newMessageSelector = 'a[data-testid="NewDM_Button"]';
          await page.waitForSelector(newMessageSelector);

          await page.evaluate(selector => {
            document.querySelector(selector) .click();
          }, newMessageSelector);

          const userFieldSelector = 'input[data-testid=searchPeople]';
          await page.waitForSelector(userFieldSelector);

          for (const user of users) {
            await page.type(userFieldSelector, user);
        
            let publicUsername;
        
            do {
              await delay(500);
        
              publicUsername = await page.evaluate(user => {
                const buttons = Array.from(document.querySelectorAll('button[data-testid="TypeaheadUser"]'));
        
                const result = buttons.filter(button => { 
                  const spans = Array.from(button.querySelectorAll('span'));
                  return spans.some(span => span.textContent?.includes(user));
                });
          
                if (result.length === 0) return null;
              
                const targetButton = result[0];
        
                return Array.from(targetButton.querySelectorAll('span')).filter(x => x.textContent)[0].textContent;
              }, `@${user}`);
            } while (!publicUsername);
        
            await delay(500);
        
            await page.evaluate(user => {
              const button = Array.from(document.querySelectorAll('button[data-testid="TypeaheadUser"]')).filter(button => {
                return Array.from(button.querySelectorAll('span')).some(span => span.textContent?.includes(user));
              })[0];
        
              button.click();
            }, `@${user}`);
        
            await page.waitForSelector(`button[aria-label="${publicUsername} - select to remove"]`);
          }

          await delay(500);

          const nextButtonSelector = 'button[data-testid="nextButton"]';
          await page.evaluate(selector => {
            document.querySelector(selector).click();
          }, nextButtonSelector);
          
          const messageTextBox = 'div[role="textbox"]';
          await page.waitForSelector(messageTextBox);
          await page.type(messageTextBox, message);
        
          const sendButton = 'button[data-testid="dmComposerSendButton"]';
          await page.evaluate(selector => {
            document.querySelector(selector).click();
          }, sendButton);
        
          await delay(500);

          await browser.close();
          return;
          await page.waitForSelector('button[aria-label="Compose new Message"]');
          await page.click('button[aria-label="Compose new Message"]');
          
          await page.waitForSelector('input[data-testid="searchPeople"]');
          for (user of users) {
            await page.type('input[data-testid="searchPeople"]', user);
            await page.click('button[data-testid="TypeaheadUser"]');
          }

          await page.waitForSelector('div[data-testid="nextButton"]');
          await page.click('div[data-testid="nextButton"]');

          await page.waitForSelector('div[role="textbox"]');
          await page.type('div[role="textbox"]', message);

          await page.waitForSelector('button[data-testid="dmComposerSendButton"]');
          await page.click('button[data-testid="dmComposerSendButton"]');

          await delay(2000);

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

      await directMessage(msg, authToken, browserlessConnection);
    });

  }
  RED.nodes.registerType("direct message", DirectMessageNode, {
    credentials: {
      authToken: { type: "password" }
    }
  });
}