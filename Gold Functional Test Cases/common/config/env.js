// Loads Gold Functional Test Cases/.env (optional, wins) then Gold Module/.env (shared with Gold Flow Entry).
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true, quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

module.exports = {
  baseURL: process.env.BASE_URL || 'http://host214.kapilits.com:8411/',
  browser: process.env.BROWSER || 'chromium',
  workers: Number(process.env.WORKERS || 1),
  allowDataCreation: process.env.ALLOW_DATA_CREATION === '1',
  allowApproval: process.env.ALLOW_APPROVAL === '1',
};
