// Runs the Gold Slab Config suite, then builds all reports (HTML, QMetry CSV, traceability, reconciliation) - works even when some
// tests fail. Run from anywhere: npm run slab-functional:qmetry   (about 40 minutes; one test waits for the inactivity warning)
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/slab-run.json' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldSlabConfig/tests/gold-slab-config-functional.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node GoldSlabConfig/build-reports.js test-results/slab-run.json', opts);
process.exit(r.status || 0);
