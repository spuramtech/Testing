const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^\d{12}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

function isValidPan(value) {
  return PAN_REGEX.test(value);
}

function isValidAadhar(value) {
  return AADHAR_REGEX.test(value);
}

function isValidIfsc(value) {
  return IFSC_REGEX.test(value);
}

function isValidGstin(value) {
  return GSTIN_REGEX.test(value);
}

function isValidPincode(value) {
  return PINCODE_REGEX.test(String(value));
}

function isFutureDate(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate.getTime() > today.getTime();
}

function isNonNegativeNumber(value) {
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}

module.exports = {
  isValidPan,
  isValidAadhar,
  isValidIfsc,
  isValidGstin,
  isValidPincode,
  isFutureDate,
  isNonNegativeNumber,
  PAN_REGEX,
  AADHAR_REGEX,
  IFSC_REGEX,
  GSTIN_REGEX,
  PINCODE_REGEX,
};
