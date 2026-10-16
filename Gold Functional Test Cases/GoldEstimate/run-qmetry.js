// Runs the Gold Estimate functional + gap suites, then builds all Gold Estimate reports (HTML, QMetry CSV, traceability, reconciliation)
// - works even when some tests fail. Run from anywhere: npm run estimate-functional:qmetry
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/estimate-run.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldEstimate/tests/gold-estimate-functional.spec.js GoldEstimate/tests/gold-estimate-gap.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node GoldEstimate/build-reports.js test-results/estimate-run.json', opts);
process.exit(r.status || 0);
