const path = require('path');
const dotenv = require('dotenv');

const env = process.env.ENV || 'qa';
const envFile = path.resolve(__dirname, '..', `.env.${env}`);

dotenv.config({ path: envFile });
dotenv.config();

const config = {
  env,
  baseUrl: process.env.BASE_URL,
  apiBaseUrl: process.env.API_BASE_URL,
  loginUsername: process.env.LOGIN_USERNAME,
  loginPassword: process.env.LOGIN_PASSWORD,
  db: {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  headless: process.env.HEADLESS !== 'false',
  defaultTimeout: Number(process.env.DEFAULT_TIMEOUT) || 30000,
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = { config };
