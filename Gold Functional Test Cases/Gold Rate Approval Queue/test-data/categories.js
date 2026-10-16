// Test-type categories for the report (Category filter and "Test types" table).
const ids = (...n) => n.map((x) => `TC_GQ_${x}`);
module.exports = [
  ['Navigation & UI layout', ids('001', '003', '006')],
  ['Data consistency', ids('002', '004')],
  ['Sorting', ids('005')],
  ['Search', ids('007', '008', '009', '010', '011')],
  ['Reject modal & remarks validation', ids('012', '013', '014', '016')],
  ['Cancel', ids('015')],
  ['Boundary & special characters', ids('017', '018')],
  ['Business rules / Payload', ids('019', '020', '024', '025')],
  ['Workflow transition (approve / reject)', ids('022', '023', '044', '045')],
  ['Usability / Safety', ids('021')],
  ['Concurrency', ids('026', '041', '050')],
  ['Error recovery', ids('027', '028')],
  ['Double submit', ids('029', '030')],
  ['Role-based access', ids('031', '032', '033', '034', '035', '049')],
  ['API', ids('036', '037', '038', '039', '040', '042', '043')],
  ['Accessibility & responsive', ids('046', '047', '048')],
  ['Session / browser', ids('051', '052')],
  ['Not applicable', ids('NA1', 'NA2', 'NA3', 'NA4')],
];
