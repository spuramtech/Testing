const fs = require('fs');
const path = require('path');

const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(screenshotsDir, `${name}-${timestamp}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

module.exports = { captureScreenshot };
