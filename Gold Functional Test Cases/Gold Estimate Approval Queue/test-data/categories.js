// Test-type categories for the report.
const ids = (...n) => n.map((x) => `TC_EQ_${x}`);
module.exports = [
  ['Navigation & UI layout', ids('001', '010', '015')],
  ['Filtering & search', ids('002', '003', '005', '006', '007')],
  ['Data consistency', ids('004', '008', '011', '013')],
  ['Detail view & audit trail', ids('012', '014')],
  ['Role-based inboxes', ids('009', '016', '017', '018', '019')],
  ['IA2 verification (simulated)', ids('020', '021', '022', '026', '027')],
  ['Required remarks & cancel', ids('023', '024', '025', '040')],
  ['Checker final approval (simulated)', ids('032', '033', '034', '035', '036', '037', '041', '043')],
  ['Usability / safety', ids('028')],
  ['Error handling & double submit', ids('029', '030', '038', '039')],
  ['Segregation of duties', ids('031', '042')],
  ['API', ids('044', '045', '046', '047', '048')],
  ['Accessibility & responsive', ids('049', '050')],
  ['Real end-to-end chain', ids('051', '054')],
  ['External appraiser / ED-MD', ids('052', '053')],
  ['Concurrency / session / browser', ids('055')],
  ['Not applicable', ids('NA1', 'NA2')],
];
