module.exports = {
  mandatoryFields: [
    { id: 'TC_CR_MF01', label: 'Subscriber', expectedMsg: 'Subscriber Required' },
  ],
  amountBoundary: [
    { id: 'TC_CR_BV01', field: 'totalreceivedamount', label: 'Negative Amount Received', value: '-500' },
    { id: 'TC_CR_BV02', field: 'totalreceivedamount', label: 'Non-numeric Amount Received', value: 'abcde' },
    { id: 'TC_CR_BV03', field: 'WaiverAmount', label: 'Negative Waiver Amount', value: '-1' },
  ],
  specialCharPayloads: [
    { id: 'TC_CR_XSS01', field: 'totalreceivedamount', label: 'XSS payload in Amount Received', value: '<script>alert(1)</script>' },
  ],
};
