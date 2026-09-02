const { chromium } = require('playwright');
const { loginAndSelectBranch } = require('./utils/navigation');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', { username: 'admin', password: 'jayapriya@123' });
  await page.goto('http://host81.kapilits.com:8007/#/configuration/chitformation', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const uniqueCode = 'QATEST' + Date.now().toString().slice(-6);
  const setSelect = async (name, val) => {
    await page.evaluate(({name,val}) => {
      const els = [...document.querySelectorAll(`select[formcontrolname="${name}"]`)];
      const el = els.find(e => e.offsetParent !== null) || els[0];
      if (!el) return null;
      el.value = val; el.dispatchEvent(new Event('change', {bubbles:true}));
      return el.value;
    }, {name, val});
  };
  const setInput = async (name, val) => {
    return page.evaluate(({name,val}) => {
      const els = [...document.querySelectorAll(`input[formcontrolname="${name}"]`)];
      const el = els.find(e => e.offsetParent !== null) || els[0];
      if (!el) return null;
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      s.call(el, val);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('blur',{bubbles:true}));
      return el.value;
    }, {name, val});
  };
  console.log('Chitvalue set:', await setSelect('Chitvalue', 'B'));
  console.log('Chitperiod set:', await setSelect('Chitperiod', 'X1-12'));
  await page.waitForTimeout(300);
  console.log('Noofauction:', await setInput('Noofauction', '12'));
  console.log('Groupcode:', await setInput('Groupcode', uniqueCode));
  console.log('Subscription:', await setInput('Subscription', '1'));

  await page.evaluate(() => {
    const radios = [...document.querySelectorAll('input[formcontrolname="Auctiondateorweekchecked"]')].filter(e=>e.offsetParent!==null);
    if (radios[0]) radios[0].click();
  });
  await page.waitForTimeout(500);

  // Try real Playwright fill on the visible Auction Date field
  const dateInput = page.locator('input[formcontrolname="Auctiondate"]:visible').first();
  await dateInput.click({ timeout: 5000 }).catch(e => console.log('date click err', e.message));
  await page.keyboard.type('25/09/2026', { delay: 30 }).catch(e => console.log('type err', e.message));
  await page.keyboard.press('Escape').catch(()=>{});
  await page.waitForTimeout(500);

  const check = await page.evaluate(() => {
    const names = ['Chitvalue','Chitperiod','Noofauction','Groupcode','Subscription','Auctiondate'];
    return names.map(n => {
      const els = [...document.querySelectorAll(`[formcontrolname="${n}"]`)].filter(e=>e.offsetParent!==null);
      return els.map(el => ({ n, classes: el.className, value: el.value }));
    });
  });
  console.log('Field states:', JSON.stringify(check, null, 2));

  const responses = [];
  page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url() + ' -> ' + res.status()); });
  await page.locator('button:visible', { hasText: 'Save' }).first().click();
  await page.waitForTimeout(2500);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('API calls:', JSON.stringify(responses));
  console.log('required/invalid after save:', bodyText.split('\n').filter(l => /required|invalid|success|created/i.test(l)).join(' | '));
  console.log('unique code:', uniqueCode);

  await browser.close();
})();
