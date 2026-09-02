const path = require('path');
const dotenv = require('dotenv');

const envName = process.env.ENV || 'qa';
const envFile = path.resolve(__dirname, '..', `.env.${envName}`);

dotenv.config({ path: envFile });
dotenv.config();

module.exports = {
  ENV: process.env.ENV || envName,
  BASE_URL: process.env.BASE_URL,
  LOGIN_USERNAME: process.env.LOGIN_USERNAME,
  LOGIN_PASSWORD: process.env.LOGIN_PASSWORD,
  DEFAULT_BRANCH: process.env.DEFAULT_BRANCH,
  DB_CLIENT: process.env.DB_CLIENT || 'mysql',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
