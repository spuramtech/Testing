// Table/column names are PLACEHOLDERS — confirm actual schema before
// enabling @database tests.
module.exports = {
  getContactByUcic: 'SELECT * FROM contact WHERE ucic = ? LIMIT 1',
  getContactByPan: 'SELECT * FROM contact_kyc_document WHERE reference_number = ? LIMIT 1',
  getAddressesByUcic: 'SELECT * FROM contact_address WHERE ucic = ?',
  getBankAccountsByUcic: 'SELECT * FROM contact_bank_account WHERE ucic = ?',
  getGstRecordsByUcic: 'SELECT * FROM contact_gst WHERE ucic = ?',
  getIncomeRecordsByUcic: 'SELECT * FROM contact_income WHERE ucic = ?',
};
