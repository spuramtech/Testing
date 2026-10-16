// Observed on host214 (15/10/2026) – texts and rules the tests assert.
module.exports = {
  remarksRequired: /Remarks are required to reject/i,
  serverRemarkRequired: /A remark is required to reject a gold rate entry/i,
  notChecker: /not configured as a Checker for Gold Rate/i,
  alreadyProcessed: /already processed by someone else/i,
  emptyState: /No gold rate submissions are waiting/i,
  approveTitle: 'Approves every gold type in this submission in one action',
  rejectTitle: 'Rejects every gold type in this submission in one action',
  lockedCard: 'Only Gold Rate checkers (Form-wise Approvals > Gold Rate)',
  goldTypes: ['24K', '22K', '21K', '20K', '19K', '18K', '14K'],
  ratio: { '22K': 0.916, '21K': 0.916, '20K': 0.916, '19K': 0.916, '18K': 0.75, '14K': 0.583 },
  fakeRecordId: 999999999,
  longRemarks: 'R'.repeat(1000),
  unicodeRemarks: 'दर गलत है – rate mismatch ₹ <b>&"\'',
  // Real approve/reject (ALLOW_APPROVAL=1) only touches these Internal Rate dates (yyyy-mm-dd). Default = the two test
  // submissions left by the Daily Gold Rate build (online rates 01/06/2026 and 04/07/2026).
  realTargets: (process.env.GQ_TARGET_DATES || '2026-06-02,2026-07-06').split(',').map((s) => s.trim()).filter(Boolean),
};
