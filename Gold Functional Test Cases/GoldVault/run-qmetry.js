// Runs the Vault suite, then builds all reports (HTML, QMetry CSV, traceability, reconciliation) - works even when some
// tests fail. Run from anywhere: npm run vault-functional:qmetry   (about 40-50 minutes)
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/vault-run.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldVault/tests/gold-vault-functional.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node GoldVault/build-reports.js test-results/vault-run.json', opts);
process.exit(r.status || 0);
