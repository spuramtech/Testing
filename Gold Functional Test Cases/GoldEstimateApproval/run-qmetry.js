// Runs the Gold Estimate Approval functional suite, then builds GoldEstimateApproval/reports/Qmetry-GoldEstimateApproval.html (works even when some tests fail).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/approval-run.json', QMETRY_SUITE: 'approval' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldEstimateApproval/tests/gold-estimate-approval-functional.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node utils/qmetry-report.js test-results/approval-run.json GoldEstimateApproval/reports/Qmetry-GoldEstimateApproval.html', opts);
process.exit(r.status || 0);
