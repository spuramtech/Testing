// Runs the complete gold-loan flow for ONE new contact, in order, stopping at the first failure.
// Every step uses only the data in test-data/current-flow.json (created by the contact step).
// Usage:  npm run flow            (small estimate – internal appraisers only)
//         npm run flow -- --from=token   (resume the SAME flow from a step after fixing a failure)
//         npm run flow -- --to=estimate-checker   (stop after a step)
//         npm run flow:external   (120.5 g estimate – adds External Appraiser 1)
const { spawnSync } = require('child_process');
const path = require('path');
const flow = require('./flow');

const external = process.argv.includes('--external');
const BACK = process.env.BACK_DATE || '';
if (BACK) console.log(`Back-dated flow: all forms dated ${BACK} (gold rate → estimate → token → disbursal); receipt today shows the dues since then`);
const steps = [
  ['contact', 'create-contact'],
  ...(BACK ? [['goldrate', 'gold-rate'], ['approval', 'gold-rate-approval']] : []),
  ['scheme', 'gold-scheme'],
  ['estimate', 'gold-estimate', external ? { ESTIMATE_GROSS_WT: '120.5', ESTIMATE_ARTICLE: 'NECKLACE' } : {}],
  ['estimate-approval', 'gold-estimate-approval'],
  ...(external ? [['estimate-external', 'gold-estimate-external']] : []),
  ['estimate-checker', 'gold-estimate-checker'],
  ['token', 'gold-token'],
  ['barcode (BH)', 'gold-barcode', { BARCODE_TYPE: 'BH' }],
  ['vault', 'vault'],
  ['safe', 'safe'],
  ['inventory', 'inventory'],
  ['barcode (Audit)', 'gold-barcode', { BARCODE_TYPE: 'Audit' }],
  ['stock-audit', 'gold-stock-audit'],
  ['disbursal', 'loan-disbursal'],
  ['disbursal-approval', 'gold-disbursal-approval'],
  ['scheduled-jobs', 'scheduled-jobs'],
  ['loan-receipt', 'loan-receipt'],
];

const fromArg = (process.argv.find((a) => a.startsWith('--from=')) || '').split('=')[1];
const startAt = fromArg ? steps.findIndex(([n]) => n === fromArg) : 0;
if (fromArg && startAt < 0) { console.log(`Unknown step "${fromArg}". Steps: ${steps.map(([n]) => n).join(', ')}`); process.exit(1); }
if (fromArg) console.log(`Resuming flow ${flow.read().flowId} from "${fromArg}" (same contact / loan)`);
const toArg = (process.argv.find((a) => a.startsWith('--to=')) || '').split('=')[1];
const endAt = toArg ? steps.findIndex(([n]) => n === toArg) : steps.length - 1;
if (toArg && endAt < 0) { console.log(`Unknown step "${toArg}"`); process.exit(1); }
const root = path.resolve(__dirname, '..');
const results = [];
for (const [name, spec, env = {}] of steps.slice(startAt, endAt + 1)) {
  console.log(`\n▶ ${name}`);
  const r = spawnSync('npx', ['playwright', 'test', `tests/${spec}.spec.js`, '--reporter=list'], {
    cwd: root, shell: true, encoding: 'utf8', env: { ...process.env, ...env },
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const status = /\d+ failed/.test(out) || r.status !== 0 ? 'FAILED' : /\d+ skipped/.test(out) && !/\d+ passed/.test(out) ? 'SKIPPED' : 'PASSED';
  out.split('\n').filter((l) => /Flow|Created|Messages|GE Number|loan|barcode|Error|Expected|Received|SKIPPED/i.test(l) && !/password/i.test(l))
    .slice(0, 8).forEach((l) => console.log('   ' + l.trim()));
  results.push([name, status]);
  console.log(`   → ${status}`);
  if (status === 'FAILED') break;
}

const f = flow.read();
console.log('\n================ FLOW SUMMARY ================');
results.forEach(([n, s]) => console.log(`${s.padEnd(8)} ${n}`));
console.log(`\nContact: ${f.contactName || '-'} (${f.mobile || '-'})  |  GE: ${f.geNumber || '-'}  |  Token: ${f.token || '-'}`);
console.log(`Loan: ${f.loanNumber || '-'} ₹${f.sanctionedAmount || '-'}  |  BH: ${f.bhBarcode || '-'}  |  Audit: ${f.auditBarcode || '-'}`);
console.log(`Packed: ${f.vaultName || '-'} / ${f.safeNo || '-'} / locker ${f.locker || '-'}  |  Disbursal: ${f.disbursalStatus || '-'}`);
console.log(`Details: ${flow.FLOW_FILE}`);
process.exit(results.some(([, s]) => s === 'FAILED') ? 1 : 0);
