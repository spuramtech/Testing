// Test-type categories for the report.
const ids = (...n) => n.map((x) => `TC_GE_${x}`);
module.exports = [
  ['Navigation & UI layout', ids('001', '014', '015')],
  ['Default values & dropdowns', ids('002', '004', '005', '008', '009', '011')],
  ['Date validation', ids('003', '059')],
  ['Contact search (autocomplete)', ids('006', '007')],
  ['Grid behaviour & Clear', ids('012', '013')],
  ['Input validation', ids('016', '017', '018', '019', '020', '021', '022', '023', '028')],
  ['Boundary & cross-field validation', ids('024', '025', '026', '027')],
  ['Required fields', ids('029', '030', '031')],
  ['Article limits', ids('010', '032')],
  ['Business rules – weight & value', ids('034', '035', '036', '037', '038', '039', '040', '041')],
  ['Business rules – LTV & scheme', ids('042', '043', '044', '051', '058')],
  ['Review & payload', ids('033', '045', '046', '047')],
  ['Error recovery & double submit', ids('048', '049', '050')],
  ['Create & workflow (real)', ids('052', '061')],
  ['API', ids('053', '054', '055')],
  ['Accessibility & responsive', ids('056', '057')],
  ['Camera / session / browser', ids('060', '062')],
  ['Not applicable', ids('NA1', 'NA2')],
];
