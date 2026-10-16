// Test data for Daily Gold Rate. 24K input-mask cases were observed on host214 (14/10/2026).
module.exports = {
  // [id, typed, expected 24K field value, description]
  inputMask: [
    ['TC_GR_019', 'abc', '', 'letters are rejected'],
    ['TC_GR_020', '@#$%&*', '', 'special characters are rejected'],
    ['TC_GR_021', '-500', '500', 'minus sign is stripped (negative rate not possible)'],
    ['TC_GR_022', '   ', '', 'whitespace only leaves the field empty'],
    ['TC_GR_023', '0', '', 'a leading zero / zero rate is not accepted'],
    ['TC_GR_024', '99999999999', '99,999', 'max 5 integer digits (boundary)'],
    ['TC_GR_025', '12.345', '12.34', 'max 2 decimal places'],
    ['TC_GR_026', '15000.5', '15,000.5', 'Indian thousand separator applied'],
    ['TC_GR_027', '0.01', '0.01', 'smallest positive rate 0.01 is kept as typed'],
    ['TC_GR_062', '१५०००', '', 'Unicode (Devanagari) digits are rejected'],
  ],
  // 24K values for the carat calculation rule (22K = 24K × 0.916, 18K = 24K × 0.75, 2 decimals)
  calc: [1, 999.99, 15175.6, 15000.55, 99999.99],
  ratio22: 0.916,
  ratio18: 0.75,
  requiredMessage: /Please enter the 24K Gold Rate/i,
  lockTitle: 'An Internal Rate derived from this closing is already Approved',
  rangeOptions: ['All', 'Today', 'YesterDay', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Custom', 'Current Financial Year'],
};
