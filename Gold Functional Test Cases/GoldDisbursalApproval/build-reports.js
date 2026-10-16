// Builds every Gold Disbursal Approval Queue report from Playwright JSON result files (later files replace earlier results for the same test):
//   node GoldDisbursalApproval/build-reports.js test-results/disbapp-run.json [more.json ...]
// Writes GoldDisbursalApproval/reports/Qmetry-GoldDisbursalApproval.html, execution-results.json and the CSV / Markdown deliverables (see export.js).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('Usage: node GoldDisbursalApproval/build-reports.js <results.json> [more.json ...]'); process.exit(1); }
// DROP: the first version of DUPLICATE_01 assumed a loan number appears once; a reverted loan can be resubmitted, so it was
// re-written (loan + status + entered-on) and re-run under a new title - the stale result of the old version is removed
const env = { QMETRY_DROP: 'every loan number appears only once', ...process.env, QMETRY_SUITE: 'disbapp', QMETRY_CASES_OUT: 'GoldDisbursalApproval/reports/execution-results.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
let r = spawnSync(`node utils/qmetry-report.js ${inputs.join(',')} GoldDisbursalApproval/reports/Qmetry-GoldDisbursalApproval.html`, opts);
if (r.status) process.exit(r.status);
r = spawnSync('node GoldDisbursalApproval/export.js', opts);
process.exit(r.status || 0);
