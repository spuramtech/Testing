/**
 * Parameterized SQL used for database-level Charge validation.
 * Table/column names are placeholders — align with the real schema.
 */
const ChargeQueries = {
  findByName: 'SELECT * FROM charge WHERE LOWER(charge_name) = LOWER(?)',
  findById: 'SELECT * FROM charge WHERE id = ?',
  countAll: 'SELECT COUNT(*) AS total FROM charge',
};

module.exports = { ChargeQueries };
