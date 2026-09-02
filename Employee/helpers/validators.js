function isNonNegativeNumber(value) {
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}

function isFutureDate(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate.getTime() > today.getTime();
}

function calculateCtc(basicSalary, allowance) {
  return Number(basicSalary) + Number(allowance);
}

function isValidDateFormat(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !Number.isNaN(new Date(dateString).getTime());
}

module.exports = { isNonNegativeNumber, isFutureDate, calculateCtc, isValidDateFormat };
