const CREDENTIALS = {
  username: process.env.LOGIN_USERNAME || 'admin@kapilit.com',
  password: process.env.LOGIN_PASSWORD || 'kapil@finsta2024',
};

const LOAN_TYPES = [
  'Bullet Loan',
  'Business Loan',
  'Gold Loan',
  'Loan Against Property',
  'Personal Loan',
];

module.exports = { CREDENTIALS, LOAN_TYPES };
