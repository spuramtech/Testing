// Builds every Gold Slab Config report from Playwright JSON result files (later files replace earlier results for the same test):
//   node GoldSlabConfig/build-reports.js test-results/slab-run.json [more.json ...]
// Writes GoldSlabConfig/reports/Qmetry-GoldSlabConfig.html, execution-results.json and the CSV / Markdown deliverables (see export.js).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('Usage: node GoldSlabConfig/build-reports.js <results.json> [more.json ...]'); process.exit(1); }
// DROP: the first version of SESSION_02 asserted an inactivity warning that was never actually observed; it was re-written and
// re-run under a new title, so the stale result of the old version is removed from the report
const env = { QMETRY_DROP: '"Stay Logged In" keeps the session', ...process.env, QMETRY_SUITE: 'slab', QMETRY_CASES_OUT: 'GoldSlabConfig/reports/execution-results.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
let r = spawnSync(`node utils/qmetry-report.js ${inputs.join(',')} GoldSlabConfig/reports/Qmetry-GoldSlabConfig.html`, opts);
if (r.status) process.exit(r.status);
r = spawnSync('node GoldSlabConfig/export.js', opts);
process.exit(r.status || 0);
