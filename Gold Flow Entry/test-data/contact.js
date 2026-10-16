// Generates unique dummy data for each run so contacts never collide.
function uniqueContact() {
  const stamp = Date.now().toString();
  const letters = stamp.slice(-6).split('').map((n) => 'ABCDEFGHIJ'[n]).join('');
  return {
    title: 'Mr',
    firstName: `AUTOTEST ${letters}`,
    lastName: 'QA',
    fatherFirstName: 'RAMESH',
    dob: [15, 6, 1990], // dd, mm, yyyy
    gender: 'male', // male | female | tgender
    mobile: `9${stamp.slice(-9)}`,
    email: `autotest.${stamp.slice(-6)}@example.com`,
    // Dummy PAN in valid format: 5 letters (4th = P), 4 digits, 1 letter
    documents: [{ type: 'PAN / FORM 60', name: 'PAN CARD', reference: `AQ${letters.slice(0, 1)}P${letters.slice(1, 2)}${stamp.slice(-4)}${letters.slice(2, 3)}` }],
    // Borrower bank account – needed later by Loan Disbursal ("please add bank details in contact")
    bank: { ifsc: 'AMCB0660010', bankName: 'AHMEDABAD MERCANTILE', branch: 'AMBAWADI', accountNo: `9${stamp.slice(-10)}` },
    address: {
      addressType: 'Permanent Address',
      residence: 'Owned',
      address: '12, Gandhi Street',
      area: 'Block 10',
      city: 'Neyveli',
      state: 'Tamil Nadu',
      district: 'Cuddalore',
      pincode: '607801',
    },
  };
}

module.exports = { uniqueContact };
