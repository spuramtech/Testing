const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

const BASE_URL = process.env.QA_BASE_URL || 'http://host81.kapilits.com:8007';

const CREDS = {
  username: process.env.QA_USERNAME,
  password: process.env.QA_PASSWORD,
};

if (!CREDS.username || !CREDS.password) {
  throw new Error(
    'QA_USERNAME and QA_PASSWORD must be set. Copy .env.example to .env and fill in real values.'
  );
}

const DEFAULT_BRANCH = process.env.QA_BRANCH || 'NEYVELI CAO';

module.exports = { BASE_URL, CREDS, DEFAULT_BRANCH };
