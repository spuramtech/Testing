const employeeGeneralInfoFieldLabels = [
  'T.H.C No.', 'ESI Eligible', 'PF Eligible', 'Passport No.', 'PAN Card No.',
  'Driving License No.', 'Department', 'Join Date', 'Joined As', 'Date Of Reporting',
  'Previous Earned Leaves Claim Date', 'Earned Leaves Claim Branch', 'Blood Group',
  'UAN Number', 'Physical handicap',
];

const employeeSalaryInfoFieldLabels = [
  'Basic Salary', 'Allowance / Variable Pay', 'Total Cost to Company (CTC)',
  'Designation', 'Role', 'Group Company', 'Branch Name', 'Employee Code', 'Payroll Eligible',
];

const employeePersonalFieldLabels = [
  'Residential Status', 'Place of Birth', 'Country of Birth', 'Nationality/Citizen of',
  'Community Details', 'Marital Status',
];

const familyDetailsFieldLabels = [
  'Relationship', 'Name', 'Date of Birth', 'Age', 'Gender', 'Martial Status', 'Education', 'Occupation', 'Phone No.',
];

const educationFieldLabels = [
  'Course', 'Group', 'School / College', 'Place', 'Year', '% Of Marks',
];

const previousExperienceFieldLabels = [
  'Organization Name', 'Designation', 'From Date', 'To Date', 'Last Pay', 'Reason For Leaving',
];

module.exports = {
  employeeGeneralInfoFieldLabels,
  employeeSalaryInfoFieldLabels,
  employeePersonalFieldLabels,
  familyDetailsFieldLabels,
  educationFieldLabels,
  previousExperienceFieldLabels,
  // Employee tab - Salary Info / Personal Details mandatory fields
  employeeMandatoryFields: [
    { id: 'TC_ROLE_EMP_MF01', label: 'Basic Salary', expectedMsg: 'Basic Salary Required' },
    { id: 'TC_ROLE_EMP_MF02', label: 'Designation', expectedMsg: 'Designation Required' },
    { id: 'TC_ROLE_EMP_MF03', label: 'Role', expectedMsg: 'Role Required' },
    { id: 'TC_ROLE_EMP_MF04', label: 'Employee Code', expectedMsg: 'Employee Code Required' },
    { id: 'TC_ROLE_EMP_MF05', label: 'Department', expectedMsg: 'Department Required' },
  ],

  employeeSalaryBoundary: [
    { id: 'TC_ROLE_EMP_BV01', label: 'Negative Basic Salary', value: '-5000' },
    { id: 'TC_ROLE_EMP_BV02', label: 'Non-numeric Basic Salary', value: 'abcde' },
    { id: 'TC_ROLE_EMP_BV03', label: 'Zero Basic Salary', value: '0' },
    { id: 'TC_ROLE_EMP_BV04', label: 'Decimal Basic Salary', value: '25000.50' },
  ],

  employeeGeneralInfoFormats: [
    { id: 'TC_ROLE_EMP_GEN01', field: 'PAN Card No.', formcontrolname: 'ppancardno', value: 'INVALIDPAN', label: 'Invalid PAN format in Employee General Information' },
  ],

  familyDetailsMandatory: [
    { id: 'TC_ROLE_EMP_FAM01', label: 'Name field is required to add a Family Details entry' },
  ],

  educationMandatory: [
    { id: 'TC_ROLE_EMP_EDU01', label: 'Education field presence check in Education entry form' },
  ],

  referralMandatoryFields: [
    { id: 'TC_ROLE_REF_MF01', label: 'Referred Branch', expectedMsg: 'Branch Name Required' },
  ],

  referralPanFormats: [
    { id: 'TC_ROLE_REF_PAN01', label: 'Invalid PAN format on Referral tab', value: 'BADPAN123' },
  ],

  specialCharPayloads: [
    { id: 'TC_ROLE_SC01', label: 'XSS payload in a free-text field does not execute', value: '<script>alert(1)</script>' },
  ],
};
