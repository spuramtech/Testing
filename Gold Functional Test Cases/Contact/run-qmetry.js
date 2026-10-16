// Runs the Contact functional + 26-type coverage suites, then builds Contact/reports/Qmetry-Contact.html
// (works even when some tests fail). Run from anywhere: npm run contact-functional:qmetry
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/qmetry-run.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test Contact/tests/contact-functional.spec.js Contact/tests/contact-coverage.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node utils/qmetry-report.js test-results/qmetry-run.json Contact/reports/Qmetry-Contact.html', opts);
process.exit(r.status || 0);
