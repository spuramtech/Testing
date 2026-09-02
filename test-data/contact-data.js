const stamp = 'QATEST_20260827';

module.exports = {
  validContact: {
    title: 'Mr',
    name: `${stamp}_Automation`,
    surname: 'DoNotUse',
    relationTitle: 'Mr',
    fatherName: `${stamp}_Father`,
    contactNumber: '9876500001',
    email: 'qatest.automation@example.com',
    address: {
      plot: '12A',
      street: 'QA Test Street',
      area: 'QA Test Area',
      city: 'Chennai',
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Chennai',
      pincode: '600001',
    },
  },

  // An existing, real production contact used ONLY to verify Edit pre-fill / read-only behavior.
  // Tests using this must never click Save Contact.
  existingContactSearchTerm: 'SANTHOSHI',

  invalidPhoneNumbers: [
    { id: 'TC_CONTACT_N01', label: 'Alphabetic phone number', value: 'abcdefghij' },
    { id: 'TC_CONTACT_N02', label: 'Phone number too short (3 digits)', value: '123' },
    { id: 'TC_CONTACT_N03', label: 'Phone number with special characters', value: '98765-00#01' },
  ],

  invalidEmails: [
    { id: 'TC_CONTACT_N04', label: 'Email missing @ symbol', value: 'qatest.example.invalid' },
    { id: 'TC_CONTACT_N05', label: 'Email missing domain', value: 'qatest@' },
  ],

  specialCharPayloads: [
    { id: 'TC_CONTACT_SC01', label: 'XSS payload in Name field', value: '<script>alert(1)</script>' },
    { id: 'TC_CONTACT_SC02', label: 'SQL injection style payload in search box', value: "' OR '1'='1" },
  ],

  // ---- Mandatory field-by-field omission matrix (Individual form) ----
  mandatoryFieldOmissions: [
    { id: 'TC_CONTACT_MF01', field: 'title', label: 'Title', expectedMsg: 'Title Required' },
    { id: 'TC_CONTACT_MF02', field: 'name', label: 'Name', expectedMsg: 'Name Required' },
    { id: 'TC_CONTACT_MF03', field: 'relationTitle', label: 'Relation Title', expectedMsg: 'Relation Title Required' },
    { id: 'TC_CONTACT_MF04', field: 'fatherName', label: 'Father Name', expectedMsg: 'Father Name Required' },
    { id: 'TC_CONTACT_MF05', field: 'contactNumber', label: 'Primary Contact Number', expectedMsg: 'Primary Contact Number Required' },
  ],

  mandatoryAddressOmissions: [
    { id: 'TC_CONTACT_MA01', field: 'plot', label: 'Plot / Flat No.' },
    { id: 'TC_CONTACT_MA02', field: 'street', label: 'Street / Building' },
    { id: 'TC_CONTACT_MA03', field: 'area', label: 'Area' },
    { id: 'TC_CONTACT_MA04', field: 'city', label: 'City/Village' },
    { id: 'TC_CONTACT_MA05', field: 'pincode', label: 'Pincode' },
  ],

  // ---- Boundary / format datasets per field ----
  contactNumberBoundary: [
    { id: 'TC_CONTACT_BV01', label: 'Exactly 10 digits (valid boundary)', value: '9000000001', shouldBeValid: true },
    { id: 'TC_CONTACT_BV02', label: '9 digits (minimum - 1)', value: '900000000', shouldBeValid: false },
    { id: 'TC_CONTACT_BV03', label: '11 digits (maximum + 1)', value: '90000000011', shouldBeValid: false },
    { id: 'TC_CONTACT_BV04', label: 'All zeros (10 digits)', value: '0000000000', shouldBeValid: true },
    { id: 'TC_CONTACT_BV05', label: 'Leading plus sign', value: '+919000000001', shouldBeValid: false },
  ],

  panPayloads: [
    { id: 'TC_CONTACT_PAN01', label: 'Valid PAN format (AAAAA9999A)', value: 'ABCDE1234F', shouldBeValid: true },
    { id: 'TC_CONTACT_PAN02', label: 'Invalid PAN - all digits', value: '1234567890', shouldBeValid: false },
    { id: 'TC_CONTACT_PAN03', label: 'Invalid PAN - lowercase letters', value: 'abcde1234f', shouldBeValid: false },
    { id: 'TC_CONTACT_PAN04', label: 'Invalid PAN - too short', value: 'ABC123', shouldBeValid: false },
  ],

  pincodePayloads: [
    { id: 'TC_CONTACT_PIN01', label: 'Valid 6-digit numeric pincode', value: '600028', shouldBeValid: true },
    { id: 'TC_CONTACT_PIN02', label: 'Non-numeric pincode', value: 'ABCDEF', shouldBeValid: false },
    { id: 'TC_CONTACT_PIN03', label: '5-digit pincode (too short)', value: '12345', shouldBeValid: false },
    { id: 'TC_CONTACT_PIN04', label: '7-digit pincode (too long)', value: '1234567', shouldBeValid: false },
  ],

  emailBoundary: [
    { id: 'TC_CONTACT_EM01', label: 'Email with spaces', value: 'qa test@example.com' },
    { id: 'TC_CONTACT_EM02', label: 'Email with double @', value: 'qa@@example.com' },
    { id: 'TC_CONTACT_EM03', label: 'Email with consecutive dots', value: 'qa..test@example.com' },
  ],

  nameSpecialCharFields: [
    { id: 'TC_CONTACT_SC03', field: 'pFatherName', label: 'Father Name', value: '<img src=x onerror=alert(1)>' },
    { id: 'TC_CONTACT_SC04', field: 'pSurName', label: 'Sur Name / Initial', value: "'; DROP TABLE contacts;--" },
    { id: 'TC_CONTACT_SC05', field: 'pAddress1', label: 'Plot / Flat No.', value: '<script>alert(1)</script>' },
    { id: 'TC_CONTACT_SC06', field: 'pCity', label: 'City/Village', value: '💥emoji_city💥' },
  ],

  longStringFields: [
    { id: 'TC_CONTACT_BV06', field: 'pName', label: 'Name', value: 'A'.repeat(300) },
    { id: 'TC_CONTACT_BV07', field: 'pAddress1', label: 'Plot / Flat No.', value: 'B'.repeat(300) },
  ],

  businessEntityData: {
    enterpriseName: `${stamp}_Enterprise`,
    email: 'qatest.enterprise@example.com',
    contactNumber: '9876500002',
    pan: 'ABCDE1234F',
  },
};
