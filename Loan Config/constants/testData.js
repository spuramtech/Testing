const { faker } = (() => {
  try {
    return require('@faker-js/faker');
  } catch {
    return { faker: null };
  }
})();

function randomSuffix() {
  return faker ? faker.string.alphanumeric(6) : Date.now().toString(36);
}

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

function buildLoanCreationPayload(overrides = {}) {
  const suffix = randomSuffix();
  return {
    loanType: 'Personal Loan',
    loanName: `Auto Loan ${suffix}`,
    loanCode: `AUTO${suffix}`,
    series: '0000001',
    ...overrides,
  };
}

module.exports = { CREDENTIALS, LOAN_TYPES, buildLoanCreationPayload };
