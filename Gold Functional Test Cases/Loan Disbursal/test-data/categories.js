// Test-type categories for the report.
const ids = (...n) => n.map((x) => `TC_LD_${x}`);
module.exports = [
  ['Navigation & UI layout', ids('001', '010')],
  ['Data consistency', ids('002', '003', '012', '013')],
  ['Filtering, search & pagination', ids('004', '005', '006', '007', '008')],
  ['Business rules', ids('009', '052')],
  ['Calculation & dates', ids('011', '014', '015', '040')],
  ['Read views', ids('016')],
  ['Mode of payment & dependent fields', ids('017', '018', '019', '020', '021')],
  ['Clear / Reset', ids('022')],
  ['Payout validation & boundaries', ids('023', '024', '025', '026', '027', '028', '029')],
  ['Max length', ids('030', '031')],
  ['Required field', ids('032', '033', '034', '035', '036', '037')],
  ['Submit payload & success', ids('038', '039', '041', '042')],
  ['Error recovery', ids('043', '044')],
  ['Double submit & duplicate prevention', ids('045', '046')],
  ['Role-based access', ids('047', '048', '049')],
  ['API', ids('050', '051', '053')],
  ['Accessibility & responsive', ids('054', '055')],
  ['Submit (real)', ids('056')],
  ['Not executed (part payment, top up, bank add, revert, back date, session)', ids('057', '058', '059', '060', '061', '062')],
  ['Not applicable', ids('NA1', 'NA2', 'NA3')],
];
