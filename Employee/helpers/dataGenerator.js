const { faker } = require('@faker-js/faker');

function randomEmployeeAmounts() {
  return {
    basicSalary: faker.number.int({ min: 10000, max: 100000 }),
    allowance: faker.number.int({ min: 0, max: 5000 }),
  };
}

module.exports = { randomEmployeeAmounts };
