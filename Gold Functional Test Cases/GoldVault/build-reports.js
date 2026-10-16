// Builds every Vault report from Playwright JSON result files (later files replace earlier results for the same test):
//   node GoldVault/build-reports.js test-results/vault-run.json [more.json ...]
// Writes GoldVault/reports/Qmetry-GoldVault.html, execution-results.json and the CSV / Markdown deliverables (see export.js).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('Usage: node GoldVault/build-reports.js <results.json> [more.json ...]'); process.exit(1); }
const env = { ...process.env, QMETRY_SUITE: 'vault', QMETRY_CASES_OUT: 'GoldVault/reports/execution-results.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
let r = spawnSync(`node utils/qmetry-report.js ${inputs.join(',')} GoldVault/reports/Qmetry-GoldVault.html`, opts);
if (r.status) process.exit(r.status);
r = spawnSync('node GoldVault/export.js', opts);
process.exit(r.status || 0);
