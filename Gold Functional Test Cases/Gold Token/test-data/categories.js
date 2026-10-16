// Test-type categories for the report.
const ids = (...n) => n.map((x) => `TC_GT_${x}`);
module.exports = [
  ['Navigation & UI layout', ids('001')],
  ['Data consistency', ids('002', '003', '006', '022')],
  ['Read views', ids('004', '005', '007', '009')],
  ['Field state & dates', ids('008', '043')],
  ['Nominee – required & business rules', ids('010', '011', '016', '018')],
  ['Nominee – input validation', ids('012', '013', '014', '015', '019')],
  ['Duplicate prevention & edit', ids('017', '020')],
  ['Loan terms from scheme', ids('021', '036')],
  ['Amount validation & boundaries', ids('023', '024', '025', '026', '027', '028', '029')],
  ['Save integrity & payload', ids('030', '031', '032')],
  ['Error handling & double submit', ids('033', '034')],
  ['Navigation (Back)', ids('035')],
  ['API', ids('037', '038')],
  ['Accessibility & responsive', ids('039', '040')],
  ['Create (real)', ids('041')],
  ['File upload / session / concurrency', ids('042', '044')],
  ['Not applicable', ids('NA1', 'NA2')],
];
