module.exports = {
  mandatoryFields: [
    { id: 'TC_GR_MF01', label: 'Group Code', expectedMsg: 'Group Code Required' },
    { id: 'TC_GR_MF02', label: 'PSO Number', expectedMsg: 'PSO Number Required' },
    { id: 'TC_GR_MF03', label: 'Registration Date', expectedMsg: 'Registration Date Required' },
    { id: 'TC_GR_MF04', label: 'Commencement Date', expectedMsg: 'Commencement Date Required' },
    { id: 'TC_GR_MF05', label: 'Termination Date', expectedMsg: 'Termination Date Required' },
  ],
  psoNumberBoundary: [
    { id: 'TC_GR_BV01', label: 'Negative PSO Number', value: '-123' },
    { id: 'TC_GR_BV02', label: 'Non-numeric PSO Number', value: 'abcde' },
    { id: 'TC_GR_BV03', label: 'Very long PSO Number (20 digits)', value: '12345678901234567890' },
  ],
  specialCharPayloads: [
    { id: 'TC_GR_XSS01', label: 'XSS payload in PSO Number', value: '<script>alert(1)</script>' },
  ],
};
