// Runs the Gold Disbursal Approval Queue suite, then builds all reports (HTML, QMetry CSV, traceability, reconciliation) - works even when some
// tests fail. Run from anywhere: npm run disbapp-functional:qmetry   (about 40-60 minutes)
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/disbapp-run.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldDisbursalApproval/tests/gold-disbursal-approval-functional.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node GoldDisbursalApproval/build-reports.js test-results/disbapp-run.json', opts);
process.exit(r.status || 0);
