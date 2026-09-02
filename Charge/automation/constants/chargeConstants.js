const TYPE_OF_LEDGER_OPTIONS = ['Income', 'Liability'];

const APPLICABLE_OPTIONS = ['Pre Loan(FI)', 'Upto Disbusement', 'Before Close', 'After Close', 'Any Time'];

const MESSAGES = {
  MANDATORY_FIELD: 'This field is required',
  DUPLICATE_CHARGE: 'Charge Name already exists',
  SAVE_SUCCESS: 'Charge saved successfully',
  DELETE_CONFIRM: 'Are you sure you want to delete',
  DELETE_SUCCESS: 'Charge deleted successfully',
};

module.exports = { TYPE_OF_LEDGER_OPTIONS, APPLICABLE_OPTIONS, MESSAGES };
