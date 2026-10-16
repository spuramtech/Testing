// Builds every Gold Estimate report from Playwright JSON result files (later files replace earlier results for the same test):
//   node GoldEstimate/build-reports.js test-results/estimate-run.json [more.json ...]
// Writes GoldEstimate/reports/Qmetry-GoldEstimate.html, execution-results.json and the CSV / Markdown deliverables (see export.js).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('Usage: node GoldEstimate/build-reports.js <results.json> [more.json ...]'); process.exit(1); }
// DROP: the first version of DUPLICATE_02 asserted a hypothesis that was refuted; it was re-written and re-run under a new title
const env = { QMETRY_DROP: '(HYPOTHESIS: observed rule)', ...process.env, QMETRY_SUITE: 'estimate', QMETRY_CASES_OUT: 'GoldEstimate/reports/execution-results.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
let r = spawnSync(`node utils/qmetry-report.js ${inputs.join(',')} GoldEstimate/reports/Qmetry-GoldEstimate.html`, opts);
if (r.status) process.exit(r.status);
r = spawnSync('node GoldEstimate/export.js', opts);
process.exit(r.status || 0);
