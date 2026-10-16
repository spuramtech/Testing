// Runs the Gold Scheme Matrix functional suite, then builds GoldScheme/reports/Qmetry-GoldScheme.html (works even when some tests fail).
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..'); // Gold Flow Entry
const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/scheme-run.json', QMETRY_SUITE: 'scheme' };
const opts = { stdio: 'inherit', shell: true, env, cwd: root };
spawnSync('npx playwright test GoldScheme/tests/gold-scheme-functional.spec.js --reporter=list,json,html', opts);
const r = spawnSync('node utils/qmetry-report.js test-results/scheme-run.json GoldScheme/reports/Qmetry-GoldScheme.html', opts);
process.exit(r.status || 0);
