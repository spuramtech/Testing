const { faker } = require('@faker-js/faker');

function randomIndividualContact() {
  return {
    firstName: faker.person.firstName(),
    middleName: faker.person.middleName(),
    lastName: faker.person.lastName(),
    dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
    gender: faker.helpers.arrayElement(['Male', 'Female']),
    mobile: faker.string.numeric(10),
    email: faker.internet.email(),
  };
}

function randomAddress() {
  return {
    // Values must match live <select formcontrolname="pAddressType"> options
    // exactly: Correspondence Address / Home / Office Address / Permanent
    // Address / Present Address.
    addressType: faker.helpers.arrayElement(['Permanent Address', 'Present Address']),
    residence: 'Owned',
    address: faker.location.streetAddress(),
    area: faker.location.county(),
    city: faker.location.city(),
    pincode: faker.string.numeric({ length: 6, allowLeadingZeros: false }),
  };
}

function randomBankAccount() {
  return {
    // bankName/branch intentionally omitted: many banks in this live demo's
    // master list have an empty branch dropdown, and which ones do can
    // shift over time. BankDetailsPage.selectBankWithBranches() finds a
    // working pair itself instead of relying on a pinned combo.
    accountType: 'Savings Account',
    nameAsPerBank: faker.person.fullName(),
    accountNumber: faker.finance.accountNumber(12),
    ifsc: 'SBIN0001234',
  };
}

function randomKycDocument() {
  return {
    documentType: 'PAN',
    documentName: 'PAN Card',
    referenceNumber: `${faker.string.alpha({ length: 5, casing: 'upper' })}${faker.string.numeric(4)}${faker.string.alpha({ length: 1, casing: 'upper' })}`,
  };
}

module.exports = { randomIndividualContact, randomAddress, randomBankAccount, randomKycDocument };
